import { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

interface AutomationRun {
    outputs: Record<string, any>;
    inputs: any;
    flow_details?: {
        founder_name: string;
        company_name: string;
    };
    approval_status?: string;
    gumloopData: {
        run_id: string;
    };
}

interface ApprovedContentProps {
    onCreateFlow?: (flowData: {
        founder_name: string;
        company_name: string;
        interview_transcript: string;
        tone: string;
    }) => void;
}

const ApprovedContent: React.FC<ApprovedContentProps> = ({ onCreateFlow }) => {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<AutomationRun | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState(false);

    const handleRegenerate = async () => {
        if (!content?.inputs) return;

        setRegenerating(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Create a new flow with the same data
            const flowData = content?.inputs;
            const payload = {
                founder_name: flowData?.founder_name,
                company_name: flowData?.company_name,
                interview_transcript: flowData?.interview_transcript || 'abc', // Empty as per requirement
                tone: flowData?.tone || 'Professional'// Default tone
            };

            await axios.post(
                'http://localhost:5000/api/flows/create',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Notify parent component to update the list
            if (onCreateFlow) {
                onCreateFlow(flowData);
            }
        } catch (err) {
            setError('Failed to regenerate content');
            console.error('Error regenerating content:', err);
        } finally {
            setRegenerating(false);
        }
    };

    useEffect(() => {
        const fetchApprovedContent = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // First get all automation runs
                const runsResponse = await axios.get('http://localhost:5000/api/flows/automation-runs', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Find the first approved run
                const approvedRun = runsResponse.data.find(
                    (run: AutomationRun) => run.approval_status === 'APPROVED'
                );

                if (approvedRun) {
                    // Get the detailed content for this run
                    const contentResponse = await axios.get(
                        `http://localhost:5000/api/flows/automation-runs/${approvedRun.gumloopData.run_id}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setContent(contentResponse.data);
                }
            } catch (err) {
                setError('Failed to fetch approved content');
                console.error('Error fetching approved content:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovedContent();
    }, []);

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

    if (!content) {
        return (
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography>No approved content available yet.</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontFamily: "'Poppins', sans-serif" }}>
                    Latest Approved Content
                </Typography>
                <Tooltip title="Regenerate content">
                    <IconButton
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        sx={{ color: '#722f37' }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            {content.flow_details && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary">
                        {content.flow_details.company_name} - {content.flow_details.founder_name}
                    </Typography>
                </Box>
            )}
            <Box sx={{ mt: 2 }}>
                {Object.entries(content.outputs || {}).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {key.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default ApprovedContent;