import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  CssBaseline,
  Link
} from '@mui/material';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = 
      await axios.post('http://localhost:5000/api/auth/login', {
       email,
        password
      });

      localStorage.setItem('token', response.data.access_token);
      navigate('/home');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>
      <CssBaseline />
      <Header showNavigation={false} />

      <Container component="main" maxWidth="xs" sx={{ pt: 8, pb: 4 }}>
        <Paper elevation={0} sx={{ p: 4, mt: 8, borderRadius: 2, border: 1, borderColor: 'grey.200' }}>
          <Typography component="h1" variant="h5" align="center" sx={{ fontFamily: "'Poppins', sans-serif" }}>
            Login
        </Typography>
        {error && (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Typography align="center">
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              sx={{ 
                textDecoration: 'none', 
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Register
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>

    <Footer />
  </Box>
  );
};

export default Login;