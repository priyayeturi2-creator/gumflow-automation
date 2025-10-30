import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Link
} from '@mui/material';

const Footer = () => {
  return (
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
  );
};

export default Footer;