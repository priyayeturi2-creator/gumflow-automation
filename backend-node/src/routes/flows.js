/**
 * @fileoverview Flow management routes
 * @description API routes for managing automation flows, workbooks, and reports
 */

const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middlewares/auth');
const Flow = require('../models/flow');
const { makeGumloopRequest, GUMLOOP_CONFIG } = require('../utils/gumloopService');
const { validateFlowCreation, validateVersionSelection, handleValidationErrors } = require('../middlewares/validation');
const { apiLimiter, flowCreationLimiter } = require('../middlewares/rateLimiter');
const { asyncHandler } = require('../middlewares/errorHandler');
var ObjectId = require('mongodb').ObjectId;

const router = express.Router();

/**
 * @typedef {Object} FlowData
 * @property {string} founder_name - Name of the founder
 * @property {string} company_name - Name of the company
 * @property {string} interview_transcript - Interview transcript content
 * @property {string} tone - Tone for content generation
 */

/**
 * @typedef {Object} SubflowVersion
 * @property {string} run_id - Unique run identifier
 * @property {string} saved_item_id - Saved item identifier
 * @property {string} url - URL to the version
 * @property {string} workbook_id - Workbook identifier
 * @property {boolean} selected - Whether version is selected
 */


/**
 * Get list of available workbooks
 * @route GET /flows/list-workbooks
 * @access Private
 * @returns {Object} List of saved workbooks
 */
router.get('/list-workbooks', apiLimiter, auth, asyncHandler(async (req, res) => {
    const data = await makeGumloopRequest('list_saved_items');
    res.json(data);
}));

/**
 * Create a new automation flow
 * @route POST /flows/create
 * @access Private
 * @param {FlowData} req.body - Flow creation data
 * @returns {Object} Created flow with Gumloop response
 */
router.post('/create',
    flowCreationLimiter,
    auth,
    validateFlowCreation,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { founder_name, company_name, interview_transcript, tone } = req.body;

        // Create flow with Gumloop API
        const gumloopData = await makeGumloopRequest('start_pipeline', {
            method: 'POST',
            body: { founder_name, company_name, interview_transcript, tone },
            params: { saved_item_id: GUMLOOP_CONFIG.SAVED_ITEM_ID }
        });

        // Set state to COMPLETED for testing
        gumloopData.state = 'COMPLETED';

        // Save flow to database
        const flow = new Flow({
            userId: req.user.userId,
            founder_name,
            company_name,
            interview_transcript,
            tone,
            gumloopResponse: gumloopData,
        });

        await flow.save();

        console.log('Flow created successfully');

        res.status(201).json({
            id: flow._id,
            founder_name: flow.founder_name,
            company_name: flow.company_name,
            interview_transcript: flow.interview_transcript,
            tone: flow.tone,
            createdAt: flow.createdAt,
            gumloopResponse: gumloopData
        });
    })
);

/**
 * Get user's flows
 * @route GET /flows/
 * @access Private
 * @returns {Array} List of user's flows
 */
router.get('/',
    apiLimiter,
    auth,
    asyncHandler(async (req, res) => {
        const flows = await Flow.find({ userId: new ObjectId(req.user.userId) })
            .sort({ createdAt: -1 });

        console.log('Flows retrieved');

        res.json(flows);
    })
);

/**
 * Get automation run details
 * @route GET /flows/:runId
 * @access Private
 * @param {string} req.params.runId - Run ID to fetch details for
 * @returns {Object} Run details from Gumloop
 */
router.get('/:runId',
    apiLimiter,
    auth,
    asyncHandler(async (req, res) => {
        const { runId } = req.params;

        console.log('Automation run details requested');

        const data = await makeGumloopRequest('get_pl_run', {
            params: { run_id: runId }
        });

        // Find the flow document
        const flow = await Flow.findOne({
            userId: new ObjectId(req.user.userId),
            'gumloopResponse.run_id': runId
        });

        const runnerArray = data.log?.filter((value) => value.indexOf("__TRIGGERED_PIPELINE__") > 0);

        const newLogs = [];
        runnerArray?.forEach((run) => {
            let ro = run.replace("__system__: __TRIGGERED_PIPELINE__  ", "")
            let roAry = ro.split("', '");
            roAry[0] = roAry[0].replace('{', '')
            roAry[6] = roAry[6]?.replace('}', '')
            roAry[7] = roAry[7]?.replace('}', '')
            let res = {};
            roAry.forEach(o => { res[o?.split("': '")[0]?.replace(/'/g, "")] = o?.split("': '")[1]?.replace(/'/g, "") || null })
            newLogs.push(res)
        });

        const subflowVersion = []

        const workbookList = await makeGumloopRequest('list_saved_items');

        newLogs.forEach(log => {
            if (flow.subflowVersion.some(version => version.run_id === log.runId) === false) {
                subflowVersion.push({
                    run_id: log.runId,
                    saved_item_id: log.pipelineId,
                    url: data.url || 'sda',
                    workbook_id: workbookList.saved_items.find(workbook => workbook.name === log.pipelineLabel)?.saved_item_id || '',
                    selected: false
                });
            }
        });

        // Update flow with new version
        await flow.updateOne({
            deep_research: data.outputs["deep research"] || "",
            subflowVersion: [...flow.subflowVersion, ...subflowVersion]
        });


        res.json(data);
    })
);


/**
 * Get automation run details
 * @route GET /flows/:runId
 * @access Private
 * @param {string} req.params.runId - Run ID to fetch details for
 * @returns {Object} Run details from Gumloop
 */
router.get('/version/:runId',
    apiLimiter,
    auth,
    asyncHandler(async (req, res) => {
        const { runId } = req.params;

        console.log('Automation run details requested');

        const data = await makeGumloopRequest('get_pl_run', {
            params: { run_id: runId }
        });


        res.json(data);
    })
);


/**
 * Mark a subflow version as selected
 * @route POST /flows/select-version
 * @access Private
 * @param {Object} req.body - Selection data
 * @param {string} req.body.runId - Main run ID
 * @param {string} req.body.selectedVersionRunId - Selected version run ID
 * @param {string} req.body.workbookId - Workbook ID
 * @returns {Object} Success message
 */
router.post('/select-version',
    apiLimiter,
    auth,
    validateVersionSelection,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { runId, selectedVersionRunId, workbookId } = req.body;

        try {
            // Find the flow document
            const flow = await Flow.findOne({
                userId: new ObjectId(req.user.userId),
                'gumloopResponse.run_id': runId
            });

            if (!flow) {
                return res.status(404).json({ message: 'Flow not found' });
            }

            // Unselect all versions for this workbook
            await Flow.updateOne(
                { _id: flow._id },
                {
                    $set: {
                        "subflowVersion.$[elem].selected": false
                    }
                },
                {
                    arrayFilters: [{ "elem.saved_item_id": workbookId }],
                    multi: true
                }
            );

            // Select the specific version
            await Flow.updateOne(
                {
                    _id: flow._id,
                    "subflowVersion.run_id": selectedVersionRunId
                },
                {
                    $set: { "subflowVersion.$.selected": true }
                }
            );

            res.json({
                message: `Version selected successfully`,
                selectedVersionId: selectedVersionRunId
            });
        } catch (error) {
            console.error('Error selecting version');
            res.status(500).json({ message: 'Error selecting version' });
        }
    })
);

/**
 * Regenerate a workbook version
 * @route POST /flows/regenerate/:savedRunId
 * @access Private
 * @param {string} req.params.savedRunId - Saved run ID to regenerate
 * @param {Object} req.body - Regeneration data
 * @param {string} req.body.runId - Original run ID
 * @returns {Object} New generated version data
 */
router.post('/regenerate/:savedRunId',
    flowCreationLimiter,
    auth,
    asyncHandler(async (req, res) => {
        const { savedRunId } = req.params;

        console.log('Workbook regeneration attempt');

        // Find the original flow
        const flow = await Flow.findOne({
            userId: new ObjectId(req.user.userId),
            'gumloopResponse.run_id': req.body.runId
        });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        // Regenerate with Gumloop API
        const regeneratedResponse = await makeGumloopRequest('start_pipeline', {
            method: 'POST',
            body: {
                founder_name: flow.founder_name,
                company_name: flow.company_name,
                deep_research: flow.deep_research || "",
                interview_transcript: flow.interview_transcript,
                tone: flow.tone
            },
            params: { saved_item_id: savedRunId }
        });

        // Update flow with new version
        await flow.updateOne({
            subflowVersion: [...flow.subflowVersion, regeneratedResponse]
        });

        console.log('Workbook regenerated successfully');

        res.status(201).json({
            gumloopResponse: regeneratedResponse
        });
    })
);

/**
 * Get combined report of selected subflow versions
 * @route GET /flows/combined-report/:runId
 * @access Private
 * @param {string} req.params.runId - Run ID to generate report for
 * @returns {Object} Combined report with selected versions' outputs
 */
router.get('/combined-report/:runId', auth, async (req, res) => {
    try {
        const { runId } = req.params;

        // Find the flow document
        const flow = await Flow.findOne({
            userId: new ObjectId(req.user.userId),
            'gumloopResponse.run_id': runId
        });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        // Filter selected subflow versions
        const selectedVersions = flow.subflowVersion.filter(version => version.selected === true);

        if (selectedVersions.length === 0) {
            return res.status(400).json({ message: 'No selected versions found' });
        }

        // Fetch outputs for each selected version
        const combinedOutputs = [];
        for (const version of selectedVersions) {
            try {
                const data = await makeGumloopRequest('get_pl_run', {
                    params: { run_id: version.run_id }
                });

                // Get the first output value
                if (data.outputs && typeof data.outputs === 'object') {
                    const firstOutputValue = Object.values(data.outputs)[0];
                    if (firstOutputValue) {
                        combinedOutputs.push({
                            runId: version.run_id,
                            workbookId: version.saved_item_id,
                            output: firstOutputValue
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching output for run_id');
                // Continue with other versions even if one fails
            }
        }

        // Combine all outputs into a single response
        const combinedContent = combinedOutputs
            .map(item => item.output)
            .join('\n\n---\n\n');

        res.json({
            runId,
            totalSelectedVersions: selectedVersions.length,
            processedVersions: combinedOutputs.length,
            combinedContent,
            individualOutputs: combinedOutputs
        });

    } catch (error) {
        console.error('Get combined report error');
        res.status(500).json({ message: 'Failed to generate combined report' });
    }
});

/**
 * Get subflow versions for a specific run
 * @route GET /flows/subflow-versions/:runId
 * @access Private
 * @param {string} req.params.runId - Run ID to get versions for
 * @returns {Object} Subflow versions data
 */
router.get('/subflow-versions/:runId', auth, async (req, res) => {
    try {
        const { runId } = req.params;

        // Find the flow document that has this runId
        const flow = await Flow.findOne({
            userId: new ObjectId(req.user.userId),
            'gumloopResponse.run_id': runId
        });

        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        // Get the subflow versions array
        const subflowVersions = flow.subflowVersion || [];

        // Return the subflow versions with metadata
        res.json({
            runId,
            versions: subflowVersions
        });
    } catch (error) {
        console.error('Get subflow versions error');
        res.status(500).json({ message: 'Failed to fetch subflow versions' });
    }
});

module.exports = router;