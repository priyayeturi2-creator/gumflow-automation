import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    CssBaseline,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';

interface Flow {
    id: string;
    founder_name: string;
    company_name: string;
    createdAt: string;
    gumloopResponse: {
        run_id: string;
        state: 'RUNNING' | 'COMPLETED' | 'FAILED';
    };
}

const FlowList = () => {
    const navigate = useNavigate();
    const [flows, setFlows] = useState<Flow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchFlows = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/flows', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFlows(response.data);
            } catch (error: any) {
                console.error('Failed to fetch flows:', error);
                setError('Failed to fetch flows');
                if (error?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFlows();
    }, [navigate]);

    const handleCreateNew = () => {
        navigate('/content-dashboard');
    };

    const handleFlowClick = (runId: string) => {
        navigate(`/content-dashboard/${runId}`);
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
            bgcolor: '#f5f5f5'
        }}>
            <CssBaseline />
            <Header />

            <Box component="main" sx={{ flexGrow: 1, pt: 10, pb: 4 }}>
                <Container maxWidth="lg">
                    <Paper sx={{ p: 4, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Typography variant="h4" component="h1" sx={{ fontFamily: "'Poppins', sans-serif" }}>
                                Working Doc Flows
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleCreateNew}
                                startIcon={<AddIcon />}
                                style={{fontSize: 12}}
                            >
                                Create New Flow
                            </Button>
                        </Box>

                        {error && (
                            <Typography color="error" sx={{ mb: 2 }}>
                                {error}
                            </Typography>
                        )}

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Company</TableCell>
                                        <TableCell>Founder</TableCell>
                                        <TableCell>Created At</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {flows.map((flow, key) => (
                                        <TableRow key={key} hover>
                                            <TableCell>{flow.company_name}</TableCell>
                                            <TableCell>{flow.founder_name}</TableCell>
                                            <TableCell>
                                                {new Date(flow.createdAt).toLocaleDateString()} - {new Date(flow.createdAt).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleFlowClick(flow.gumloopResponse.run_id)}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Container>
            </Box>

            <Footer />
        </Box>
    );
};

export default FlowList;