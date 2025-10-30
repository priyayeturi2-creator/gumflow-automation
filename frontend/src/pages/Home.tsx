import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  AppBar,
  Toolbar,
  CssBaseline,
  Link,
} from '@mui/material';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';

// Define the structure for automation config
interface AutomationType {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'inactive';
}

// This could come from an API or configuration file
const AVAILABLE_AUTOMATIONS: AutomationType[] = [
  {
    id: 'content-automation',
    title: 'Working Doc Automation',
    description: 'Automate Workiing Doc generation from interview transcripts',
    icon: '📝',
    route: '/content-dashboard-flow-list',
    status: 'active'
  },
  {
    id: 'email-automation',
    title: 'Email Automation',
    description: 'Automate email responses and follow-ups',
    icon: '📧',
    route: '/dashboard/email',
    status: 'active'
  },
  {
    id: 'social-automation',
    title: 'Social Media Automation',
    description: 'Schedule and automate social media posts',
    icon: '🔄',
    route: '/dashboard/social',
    status: 'inactive'
  }
];

const Home = () => {
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          bgcolor: '#722f37',
          borderBottom: 1, 
          borderColor: 'grey.200'
        }}
      >
        <Toolbar>
          <SmartDisplayIcon sx={{ mr: 1.5, color: 'white' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontFamily: "'Poppins', sans-serif",
              color: 'white',
              textAlign: 'left'
            }}
          >
            GumFlow
          </Typography>
          <Button 
            onClick={() => navigate('/login')}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              color: 'white'
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, pt: 10, pb: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, mt: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              Welcome to GumFlow Automation Hub
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              paragraph
            >
              Select an automation workflow to get started
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {AVAILABLE_AUTOMATIONS.map((automation) => (
              <Box key={automation.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    border: 1,
                    borderColor: 'grey.200',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: automation.status === 'active' ? 'pointer' : 'default',
                    opacity: automation.status === 'active' ? 1 : 0.7,
                    '&:hover': automation.status === 'active' ? {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    } : {},
                  }}
                  onClick={() => automation.status === 'active' && handleNavigate(automation.route)}
                >
                  <Box sx={{ mb: 2, fontSize: '2rem' }}>
                    {automation.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {automation.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                  >
                    {automation.description}
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'inline-block',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: automation.status === 'active' ? 'success.soft' : 'grey.100',
                      color: automation.status === 'active' ? 'success.main' : 'text.disabled',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {automation.status === 'active' ? 'Available' : 'Coming Soon'}
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'grey.50',
          borderTop: 1,
          borderColor: 'grey.200'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Link
              component={RouterLink}
              to="/about"
              color="text.secondary"
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              About Us
            </Link>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} GumFlow. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;