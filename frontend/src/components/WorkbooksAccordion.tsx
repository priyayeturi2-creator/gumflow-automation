/**
 * @fileoverview WorkbooksAccordion Component
 * @description Component for managing workbook versions, selections, and approvals
 */

import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Tooltip,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import Markdown from 'react-markdown';
import { apiService, getErrorMessage } from '../services/apiService';

/**
 * @typedef {'RUNNING' | 'COMPLETED' | 'FAILED' | 'DONE' | 'APPROVED'} RunState
 */
type RunState = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DONE' | 'APPROVED';

/**
 * @interface Log
 * @description Represents a pipeline execution log
 */
interface Log {
  outputs: string;
  pipelineId: string;
  pipelineLabel: string;
  projectId: string;
  runId: string;
  runState: RunState;
  savedItemName: string;
}

/**
 * @interface SavedItem
 * @description Represents a saved workbook item
 */
interface SavedItem {
  created_ts: string;
  description: string | null;
  name: string;
  saved_item_id: string;
}

/**
 * @interface SubflowVersion
 * @description Represents a version of a subflow
 */
interface SubflowVersion {
  run_id: string;
  saved_item_id: string;
  url: string;
  workbook_id: string;
  selected?: boolean;
}

/**
 * @interface RegenerationSuccess
 * @description Represents a successful regeneration or approval action
 */
interface RegenerationSuccess {
  workbookId: string;
  runId: string;
  action: 'regenerate' | 'approve';
}

/**
 * @interface WorkbooksAccordionProps
 * @description Props for the WorkbooksAccordion component
 */
interface WorkbooksAccordionProps {
  logs: Log[];
  runId: string;
  subFlowOutput: { [key: string]: any };
  setSubFlowOutput: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>;
  flowState: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DONE';
}

/**
 * WorkbooksAccordion Component
 * @description Manages workbook versions, selections, and approvals in an accordion interface
 * @param {WorkbooksAccordionProps} props - Component props
 * @returns {JSX.Element} WorkbooksAccordion component
 */
const WorkbooksAccordion: React.FC<WorkbooksAccordionProps> = ({ 
  logs, 
  runId, 
  subFlowOutput, 
  setSubFlowOutput,
  flowState
}) => {
  const [workbooks, setWorkbooks] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regenerationSuccess, setRegenerationSuccess] = useState<RegenerationSuccess | null>(null);
  const [selectedSubflows, setSelectedSubflows] = useState<{ [key: string]: string }>({});
  const [subflowVersion, setSubflowVersion] = useState<SubflowVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<string | null>(null);
  const [approvingVersion, setApprovingVersion] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    const fetchWorkbooks = async () => {
      try {
        const response = await apiService.flows.getWorkbooks();
        setWorkbooks(response.data.saved_items || []);
      } catch (err: any) {
        console.error('Error fetching workbooks:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkbooks();
  }, []);


  const fetchSubflowVersions = async (workbookId: string) => {
    if (!runId) return;

    setLoadingVersions(workbookId);
    try {
      const response = await apiService.flows.getSubflowVersions(runId);
      const versions = response.data.versions || [];
      setSubflowVersion(versions);

      // If any version is selected, update the corresponding workbook log state to APPROVED
      const selectedVersion = versions.find((v: any) => v.selected && v.saved_item_id === workbookId);
      if (selectedVersion) {
        const workbookName = workbooks.find(w => w.saved_item_id === workbookId)?.name;
        if (workbookName) {
          logs.forEach(log => {
            if (log.pipelineLabel === workbookName) {
              log.runState = 'APPROVED';
            }
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching subflow versions:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingVersions(null);
    }
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (!regenerationSuccess) return;
    
    const timer = setTimeout(() => {
      setRegenerationSuccess(null);
    }, 5000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [regenerationSuccess]);

  const handleAccordionChange = (workbookId: string) => async (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? workbookId : false);
    if (isExpanded) {
      setLoadingContent(workbookId);
      try {
        // First fetch versions
        await fetchSubflowVersions(workbookId);
        
        // Find selected version from the updated subflowVersion state
        const selectedVersion = subflowVersion.find((v: SubflowVersion) => v.selected && v.saved_item_id === workbookId);
        
        if (selectedVersion) {
          // If there's a selected version, fetch its content
          const response = await apiService.flows.getById(selectedVersion.run_id);

          const outputs = response.data.outputs || {};
          const firstOutputValue = Object.values(outputs)[0] || '';

          if (firstOutputValue) {
            const workbookName = workbooks.find(w => w.saved_item_id === workbookId)?.name;
            if (workbookName) {
              setSubFlowOutput(prev => ({
                ...(prev || {}),
                [`${workbookName} output`]: firstOutputValue
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error in accordion change:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoadingContent(null);
      }
    }
  };

  const handleSubflowSelect = async (workbookId: string, selectedVersionRunId: string) => {
    // Don't clear success message here - let the timer handle it
    
    try {
      // Get the details of the selected version
      const selectedVersion = await apiService.flows.getById(selectedVersionRunId);

      console.log('Selected Subflow Version:', selectedVersion.data);

      // Get the first property's value from the outputs
      const outputs = selectedVersion.data.outputs || {};
      const firstOutputValue = Object.values(outputs)[0] || '';

      // Update local state for selected subflow
      setSelectedSubflows(prev => ({
        ...prev,
        [workbookId]: selectedVersionRunId
      }));

      // Update the local subflowVersion state to show selection in UI
      setSubflowVersion(prevVersions => {
        return prevVersions.map(version => ({
          ...version,
          selected: version.saved_item_id === workbookId && version.run_id === selectedVersionRunId
        }));
      });

      // Update the subFlowOutput with the selected version's content
      if (firstOutputValue && setSubFlowOutput) {
        const workbookName = workbooks.find(w => w.saved_item_id === workbookId)?.name;
        if (workbookName) {
          try {
            setSubFlowOutput(prev => ({
              ...(prev || {}),
              [`${workbookName} output`]: firstOutputValue
            }));
          } catch (error) {
            console.error('Error updating subflow output:', error);
            setError(getErrorMessage(error));
          }
        }
      }
    } catch (err) {
      console.error('Error displaying version:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleRegenerate = async (subTaskRunId: string, workbookId: string) => {
    setRegenerationSuccess(null);
    setError(null);
    setRegenerating(workbookId);  // Set regenerating state at the start

    try {
      const response = await apiService.flows.regenerate(subTaskRunId, { runId });

      setRegenerationSuccess({
        workbookId,
        runId: response.data.gumloopResponse.run_id,
        action: 'regenerate'
      });
      console.log('Regeneration success message set for workbook:', workbookId);
      // Refresh the version list after successful regeneration
      await fetchSubflowVersions(workbookId);
    } catch (err) {
      console.error('Error regenerating workbook:', err);
      setError(getErrorMessage(err));
    } finally {
      setRegenerating(null);
    }
  };

  const handleApprove = async (workbookId: string) => {
    setApprovingVersion(workbookId);
    try {
      const selectedVersionId = selectedSubflows[workbookId];
      if (!selectedVersionId) {
        setError('Please select a version to approve');
        return;
      }

      // Update the selected version in the database
      await apiService.flows.selectVersion({ 
        runId,
        selectedVersionRunId: selectedVersionId,
        workbookId 
      });

      // Refresh the subflow versions to show updated selection status
      fetchSubflowVersions(workbookId);
      
      // Show success message
      setRegenerationSuccess({
        workbookId,
        runId: selectedVersionId,
        action: 'approve'
      });
      console.log('Approval success message set for workbook:', workbookId);

      // Update the local logs to show approved state
      const workbookName = workbooks.find(w => w.saved_item_id === workbookId)?.name;
      if (workbookName) {
        logs.forEach(log => {
          if (log.pipelineLabel === workbookName) {
            log.runState = 'APPROVED';
          }
        });
      }

    } catch (err) {
      console.error('Error approving version:', err);
      setError(getErrorMessage(err));
    } finally {
      setApprovingVersion(null);
    }
  };


  /**
   * Downloads a combined report of all selected workbook versions
   * @async
   * @function handleDownloadReport
   * @description Fetches combined report from API and generates downloadable file
   */
  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      // Fetch combined report from API
      const response = await apiService.flows.getCombinedReport(runId);
      const { combinedContent, individualOutputs } = response.data;

      if (!combinedContent || combinedContent.trim() === '') {
        setError('No content available to download. Please select versions for workbooks.');
        return;
      }

      // Create formatted report content
      const reportHeader = `# Workbook Report\n\nGenerated on: ${new Date().toLocaleDateString()}\nRun ID: ${runId}\n\n---\n\n`;
      
      // Format individual outputs with workbook names
      const formattedContent = individualOutputs
        .map((item: any, index: number) => {
          const workbook = workbooks.find(w => w.saved_item_id === item.workbookId);
          const workbookName = workbook?.name || `Workbook ${index + 1}`;
          return `# ${workbookName}\n\n${item.output}\n\n---\n\n`;
        })
        .join('');

      const finalContent = reportHeader + formattedContent;

      // Create and download the file
      const blob = new Blob([finalContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workbook-report-${runId}-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Error downloading report:', err);
      setError(getErrorMessage(err));
    } finally {
      setDownloadingReport(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography>{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mb: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            pl: 1
          }}
        >
          Available Workbooks
        </Typography>
        {flowState !== 'FAILED' && (
          <Button
            variant="contained"
            startIcon={downloadingReport ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            sx={{
              textTransform: 'none',
              borderRadius: 1.5,
              px: 3
            }}
          >
            {downloadingReport ? 'Downloading...' : 'Download Report'}
          </Button>
        )}
      </Box>
      {workbooks.map((workbook) => {
        const workbookLog = logs.find((log: Log) => log.pipelineLabel === workbook.name);

        return (
          <Accordion
            key={workbook.saved_item_id}
            expanded={expandedAccordion === workbook.saved_item_id}
            onChange={handleAccordionChange(workbook.saved_item_id)}
            sx={{
              '&:not(:last-child)': {
                borderBottom: '1px solid',
                borderColor: 'divider'
              },
              '&:before': {
                display: 'none'
              },
              boxShadow: 'none'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 500, fontSize: '1rem' }}>
                  {workbook.name}
                </Typography>
                {workbook.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.875rem', mt: 0.5 }}
                  >
                    {workbook.description}
                  </Typography>
                )}
              </Box>
              {workbookLog && (
                <Box sx={{ ml: 2 }}>
                  <Tooltip title={`Status: ${workbookLog.runState}`}>
                    {(() => {
                      switch (workbookLog.runState) {
                        case 'APPROVED':
                          return <CheckCircleIcon color="success" />;
                        case 'DONE':
                          return <CheckCircleIcon color="warning" />;
                        case 'FAILED':
                          return <ErrorIcon color="error" />;
                        case 'RUNNING':
                          return <CircularProgress size={20} />;
                        default:
                          return <Box component="span" />;
                      }
                    })()}
                  </Tooltip>
                </Box>
              )}
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 2 }}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {loadingContent === workbook.saved_item_id ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2 }}>Loading content...</Typography>
                    </Box>
                  ) : workbookLog?.outputs ? (
                    <div className="markdown-content">
                      <Markdown>
                        {subFlowOutput[`${workbook.name} output`] || ''}
                      </Markdown>
                    </div>
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No content available. Please select a version to view content.
                    </Typography>
                  )}
                </Box>

                {/* Subflow Selection Radio Group */}
                <Box sx={{
                  minWidth: '200px',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  alignSelf: 'flex-start'
                }}>
                  <div>
                    <FormControl component="fieldset" size="small">
                      <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
                        Select Version
                        {loadingVersions === workbook.saved_item_id && (
                          <CircularProgress size={16} sx={{ ml: 1 }} />
                        )}
                      </FormLabel>
                      {loadingVersions === workbook.saved_item_id ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Loading versions...
                          </Typography>
                        </Box>
                      ) : (
                        <RadioGroup
                          value={selectedSubflows[workbook.saved_item_id] || ''}
                          onChange={(e) => handleSubflowSelect(workbook.saved_item_id, e.target.value)}
                        >
                          {subflowVersion
                            .filter((subflow: SubflowVersion) => subflow.saved_item_id === workbook.saved_item_id)
                            .map((version: SubflowVersion, index: number) => (
                              <FormControlLabel
                                key={version.run_id}
                                value={version.run_id}
                                control={<Radio size="small" checked={version.selected} />}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: '0.813rem',
                                        fontWeight: version.selected ? 600 : 400,
                                        color: version.selected ? 'primary.main' : 'text.primary'
                                      }}
                                    >
                                      Version {index + 1}
                                      {version.selected && (
                                        <Typography 
                                          component="span" 
                                          sx={{ 
                                            ml: 1, 
                                            fontSize: '0.75rem',
                                            color: 'success.main' 
                                          }}
                                        >
                                          (Selected)
                                        </Typography>
                                      )}
                                    </Typography>
                                  </Box>
                                }
                              />
                            ))}
                        </RadioGroup>
                      )}
                    </FormControl>
                    {regenerationSuccess?.workbookId === workbook.saved_item_id && (
                      <Typography color="success.main" sx={{ mt: 1, mb: 1, fontSize: '0.875rem' }}>
                        {regenerationSuccess.action === 'regenerate' 
                          ? 'Regeneration is successful!' 
                          : 'Version has been approved successfully!'
                        }
                      </Typography>
                    )}
                  </div>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      disabled={regenerating === workbook.saved_item_id}
                      onClick={() => {
                        if (workbookLog?.pipelineId) {
                          handleRegenerate(workbookLog.pipelineId, workbook.saved_item_id);
                        }
                      }}
                      sx={{ flex: 1 }}
                    >
                      {regenerating === workbook.saved_item_id ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(workbook.saved_item_id)}
                      disabled={!selectedSubflows[workbook.saved_item_id] || approvingVersion === workbook.saved_item_id}
                      sx={{ flex: 1 }}
                    >
                      {approvingVersion === workbook.saved_item_id ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                          Approving...
                        </>
                      ) : (
                        'Approve'
                      )}
                    </Button>
                  </Box>
                </Box>

              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
};

export default WorkbooksAccordion;