// Moving content from Dashboard.tsx to ContentDashboard.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    CssBaseline,
    CircularProgress,
    Chip,
    IconButton
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import RefreshIcon from '@mui/icons-material/Refresh';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WorkbooksAccordion from '../components/WorkbooksAccordion';
import apiService, { getErrorMessage } from '../services/apiService';

interface FlowForm {
    founder_name: string;
    company_name: string;
    interview_transcript: string;
    tone: string;
}

interface FormErrors {
    founder_name: string;
    company_name: string;
    interview_transcript: string;
    tone: string;
}

interface GumloopResponse {
    url: string;
    run_id: string;
    state: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DONE';
    id: string;
    saved_item_id: string;
    workbook_id: string;
    gumloopResponse: {
        run_id: string;
    }
}


interface Log {
    outputs: string
    pipelineId: string
pipelineLabel: string
projectId: string
runId: string
runState: "RUNNING" | "COMPLETED" | "FAILED" | 'DONE'
savedItemName: string
}

const ContentDashboard = () => {
    const navigate = useNavigate();
    const { runId } = useParams();
    const [loading, setLoading] = useState(true);
    const [flowLoading, setFlowLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [automationRunning, setAutomationRunning] = useState(false);
    const [gumloopResponse, setGumloopResponse] = useState<GumloopResponse | {}>({state:'RUNNING'});
    const [logs, setLogs] = useState<Array<Log>>([]);
    const [refreshingStatus, setRefreshingStatus] = useState(false);
    const [subFlowOutput, setSubFlowOutput] = useState<{[key: string]: any}>({});
    const [fileContent, setFileContent] = useState('');
    const initialized = useRef(false);
    const [formData, setFormData] = useState<FlowForm>({
        founder_name: '',
        company_name: '',
        interview_transcript: '',
        tone: ''
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({
        founder_name: '',
        company_name: '',
        interview_transcript: '',
        tone: ''
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
          const content = e.target?.result;
          if (typeof content === 'string') {
            setFileContent(content); // Update state with file content
          }
        };

        reader.readAsText(file); // Read the file as text
        }
      };

    const handleRefreshStatus = async () => {
        if (!runId) return;
        
        setRefreshingStatus(true);
        try {
            const response = await apiService.flows.getById(runId);

            const runnerArray = response.data.log?.filter((value:string) => value.indexOf("__TRIGGERED_PIPELINE__") > 0);

            const newLogs: any[] = [];
            runnerArray?.forEach((run: string) => {
                let ro = run.replace("__system__: __TRIGGERED_PIPELINE__  ", "")
                let roAry = ro.split("', '");
                roAry[0] = roAry[0].replace('{','')
                roAry[6] = roAry[6]?.replace('}','')
                roAry[7] = roAry[7]?.replace('}','')
                let res: any = {};
                roAry.forEach(o => {res[o?.split("': '")[0]?.replace(/'/g, "")]=o?.split("': '")[1]?.replace(/'/g, "") || null})
                newLogs.push(res)
            });

            // Update existing logs or add new ones
            setLogs(prevLogs => {
                const updatedLogs = [...prevLogs];
                newLogs.forEach(newLog => {
                    const existingLogIndex = updatedLogs.findIndex(log => log.runId === newLog.runId);
                    if (existingLogIndex >= 0) {
                        // Update existing log
                        updatedLogs[existingLogIndex] = {
                            ...updatedLogs[existingLogIndex],
                            ...newLog
                        };
                    } else {
                        // Add new log
                        updatedLogs.push(newLog);
                    }
                });
                const finaloutput:string =response.data.log?.filter((value: string) => value.indexOf("__standard__: response")>-1)[0]?.replace("__standard__: response:", "")
                updatedLogs.push({
                    pipelineLabel: "Gumflow Generator", 
                    outputs: finaloutput,
                    pipelineId: "",
                    projectId: "",
                    runId: "",
                    runState: "DONE",
                    savedItemName: ""
                });
                return updatedLogs;
            });
            setGumloopResponse(prev => prev ? {
                ...prev,
                    state: response.data.state
            } : {});  
            setSubFlowOutput(response.data.outputs || {});
            
        } catch (error: any) {
            console.error('Failed to refresh status:', error);
            setError(getErrorMessage(error));
        } finally {
            setRefreshingStatus(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
             if (!initialized.current) {
        initialized.current = true;
            try {
                await apiService.auth.getMe();
                // Only call handleRefreshStatus if we have a runId
                if (runId) {
                    await handleRefreshStatus();
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                setError(getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        }
        };

        fetchData();
    }, [navigate, runId]);

    const handleOpenCreateDialog = () => {
        setOpenCreateDialog(true);
    };

    const handleCloseCreateDialog = () => {
        setOpenCreateDialog(false);
        setFormData({
            founder_name: '',
            company_name: '',
            interview_transcript: '',
            tone: ''
        });
        setFormErrors({
            founder_name: '',
            company_name: '',
            interview_transcript: '',
            tone: ''
        });
    };

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'founder_name':
                if (!value.trim()) {
                    return 'Founder name is required';
                }
                if (value.trim().length < 2) {
                    return 'Founder name must be at least 2 characters';
                }
                if (value.trim().length > 50) {
                    return 'Founder name must be less than 50 characters';
                }
                if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
                    return 'Founder name can only contain letters, spaces, hyphens, and apostrophes';
                }
                return '';
            
            case 'company_name':
                if (!value.trim()) {
                    return 'Company name is required';
                }
                if (value.trim().length < 2) {
                    return 'Company name must be at least 2 characters';
                }
                if (value.trim().length > 100) {
                    return 'Company name must be less than 100 characters';
                }
                return '';
            
            case 'interview_transcript':
                // No validation for interview transcript
                return '';
            
            case 'tone':
                if (!value) {
                    return 'Please enter a tone';
                }
                if (value.trim().length < 2) {
                    return 'Please enter a valid tone';
                }
                return '';
            
            default:
                return '';
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {
            founder_name: validateField('founder_name', formData.founder_name),
            company_name: validateField('company_name', formData.company_name),
            interview_transcript: validateField('interview_transcript', formData.interview_transcript),
            tone: validateField('tone', formData.tone)
        };

        setFormErrors(errors);

        // Check if there are any errors
        return !Object.values(errors).some(error => error !== '');
    };

    const isFormValid = (): boolean => {
        // Check if all required fields are filled and have no errors
        const hasRequiredFields = !!(formData.founder_name.trim() && 
                                    formData.company_name.trim() && 
                                    formData.tone);
        
        const hasNoErrors = !Object.values(formErrors).some(error => error !== '');
        
        return hasRequiredFields && hasNoErrors;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: FlowForm) => ({
            ...prev,
            [name]: value
        }));

        // Clear the error for this field when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Real-time validation for immediate feedback
        const fieldError = validateField(name, value);
        if (fieldError) {
            setFormErrors(prev => ({
                ...prev,
                [name]: fieldError
            }));
        }
    };

    const handleCreateFlow = async () => {
        // Validate the form first
        if (!validateForm()) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        // For regeneration, we only require founder_name and company_name
        if (!formData.founder_name || !formData.company_name) {
            setError('Company and founder names are required');
            return;
        }

        // Set default values for optional fields
        const flowDataToSubmit = {
            ...formData,
            interview_transcript: fileContent ||formData.interview_transcript,
            tone: formData.tone || 'Professional'
        };

        setFlowLoading(true);
        setError(null);
        setAutomationRunning(true);
        try {
            const response = await apiService.flows.create(flowDataToSubmit);
            setGumloopResponse(response.data);
            setSuccess(true);
            handleCloseCreateDialog();
            navigate(`/content-dashboard/${response.data.gumloopResponse.run_id}`);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setFlowLoading(false);
            setAutomationRunning(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: 'background.default'
            }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: '#f5f5f5'  // Light grey background
        }}>
            <CssBaseline />
            <Header />

            {/* Fixed Notifications below Header */}
            <Box sx={{ 
                position: 'fixed', 
                top: '64px', // Adjust based on header height
                left: 0,
                right: 0,
                width: '100%',
                zIndex: 1300, // Higher than most MUI components
                pointerEvents: 'none' // Allow clicks to pass through when notifications are hidden
            }}>
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError(null)}
                    sx={{ 
                        position: 'relative',
                        width: '100%',
                        pointerEvents: 'auto' // Re-enable pointer events for the snackbar itself
                    }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%', maxWidth: '600px' }}>
                        {error}
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={success}
                    autoHideDuration={null}
                    onClose={() => {
                        setSuccess(false);
                    }}
                    sx={{ 
                        position: 'relative',
                        width: '100%',
                        pointerEvents: 'auto' // Re-enable pointer events for the snackbar itself
                    }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        severity="success"
                        onClose={() => {
                            setSuccess(false);
                        }}
                        sx={{ width: '100%' }}
                    >
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Flow created successfully!
                        </Typography>
                        {automationRunning && (
                            <Typography variant="body2" color="text.secondary">
                                Automating flow creation...
                            </Typography>
                        )}
                    </Alert>
                </Snackbar>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, pt: 10, pb: 4 }}>
                <Container maxWidth="lg">
                    {/* Create Post Dialog */}
                    <Dialog
                        open={openCreateDialog}
                        onClose={handleCloseCreateDialog}
                        maxWidth="md"
                        fullWidth
                        PaperProps={{
                            elevation: 2,
                            sx: { borderRadius: 2 }
                        }}
                    >
                        <DialogTitle sx={{
                            fontFamily: "'Poppins', sans-serif",
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: '#722f37',
                            color: 'white',
                            textAlign: 'left'
                        }}>
                            Start New Gumflow Automation
                        </DialogTitle>
                        <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                                <TextField
                                    name="founder_name"
                                    label="Founder Name"
                                    value={formData.founder_name}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    error={!!formErrors.founder_name}
                                    helperText={formErrors.founder_name || 'Enter the founder\'s full name (2-50 characters)'}
                                />
                                <TextField
                                    name="company_name"
                                    label="Company Name"
                                    value={formData.company_name}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    error={!!formErrors.company_name}
                                    helperText={formErrors.company_name || 'Enter the company name (2-100 characters)'}
                                />
                                <input type="file" onChange={handleFileChange} />
                                <TextField
                                    name="interview_transcript"
                                    label="Interview Transcript"
                                    value={fileContent || formData.interview_transcript}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={6}
                                    variant="outlined"
                                    error={!!formErrors.interview_transcript}
                                    helperText={formErrors.interview_transcript || `Enter the interview transcript (optional). Current: ${(fileContent || formData.interview_transcript).length} characters`}
                                />
                                <TextField
                                    name="tone"
                                    label="Tone"
                                    value={formData.tone}
                                    onChange={handleInputChange}
                                    fullWidth
                                    required
                                    variant="outlined"
                                    error={!!formErrors.tone}
                                    helperText={formErrors.tone || 'Enter the desired tone for the content'}
                                />
                                   
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Button
                                onClick={handleCloseCreateDialog}
                                sx={{ textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateFlow}
                                variant="contained"
                                disabled={flowLoading || !isFormValid()}
                                sx={{
                                    textTransform: 'none',
                                    px: 3
                                }}
                            >
                                {flowLoading ? 'Creating...' : 'Create Flow'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Dashboard Content */}
                    <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                borderRadius: 2,
                                bgcolor: 'white',
                                border: 1,
                                borderColor: 'grey.200'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4}}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/content-dashboard-flow-list')}
                                    startIcon={<ArrowBackIosIcon fontSize="small"/>}
                                    style={{fontSize: 12}}
                                >
                                    Back to Flow List
                                </Button>
                            </Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                gutterBottom
                                sx={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    textAlign: 'left'
                                }}
                            >
                                Gumflow Automation Dashboard
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                paragraph
                                sx={{ mb: 4, textAlign: 'left' }}
                            >
                                Create and manage your automated Gumflow processes
                            </Typography>
                            {runId ?
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Chip
                                        label={`Status: ${'state' in gumloopResponse ? gumloopResponse.state : 'RUNNING'}`}
                                        color={
                                            'state' in gumloopResponse && gumloopResponse.state === 'COMPLETED' ? 'success' :
                                            'state' in gumloopResponse && gumloopResponse.state === 'FAILED' ? 'error' : 'warning'
                                        }
                                    />
                                    <IconButton 
                                        onClick={handleRefreshStatus}
                                        disabled={refreshingStatus}
                                        size="small"
                                    >
                                        <RefreshIcon /> 
                                    </IconButton> Check status
                                    {refreshingStatus && <CircularProgress size={20} />}
                                </Box>
                            :
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleOpenCreateDialog}
                                    size="large"
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        px: 4,
                                        py: 1.5,
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    Start New Gumflow Automation
                                </Button>
}
                        </Paper>

                        <hr />

                        {/* Available Workbooks */}
                        {runId && <WorkbooksAccordion 
                            logs={logs} 
                            runId={runId} 
                            subFlowOutput={subFlowOutput} 
                            setSubFlowOutput={setSubFlowOutput}
                            flowState={'state' in gumloopResponse ? gumloopResponse.state : 'RUNNING'}
                        />}

                        {/* Automation Runs Table */}
                    </Box>
                </Container>
            </Box>



            <Footer />
        </Box>
    );
};

export default ContentDashboard;