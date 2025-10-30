import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  CssBaseline
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>
      <CssBaseline />
      <Header />

      {/* Main Content */}
      <Container 
        maxWidth="md" 
        sx={{ 
          mt: 12, 
          mb: 4 
        }}
      >
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
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              color: 'text.primary',
              textAlign: 'left',
              mb: 4
            }}
          >
            About GumFlow
          </Typography>

          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              textAlign: 'left', 
              mb: 3 
            }}
          >
            GumFlow is an innovative content automation platform designed to streamline and enhance your content creation process. Our platform combines advanced automation with intelligent content generation to help businesses create engaging, high-quality content efficiently.
          </Typography>

          <Typography 
            variant="body1" 
            paragraph
            sx={{ 
              textAlign: 'left', 
              mb: 3 
            }}
          >
            Our mission is to empower businesses with tools that transform raw interview transcripts into polished, engaging content while maintaining the authentic voice of your brand.
          </Typography>

          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              mt: 4, 
              mb: 2,
              textAlign: 'left'
            }}
          >
            Key Features
          </Typography>

          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" sx={{ mb: 1, textAlign: 'left' }}>
              Automated content generation from interview transcripts
            </Typography>
            <Typography component="li" sx={{ mb: 1, textAlign: 'left' }}>
              Multiple tone customization options
            </Typography>
            <Typography component="li" sx={{ mb: 1, textAlign: 'left' }}>
              Real-time automation progress tracking
            </Typography>
            <Typography component="li" sx={{ mb: 1, textAlign: 'left' }}>
              Content review and approval workflow
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default About;