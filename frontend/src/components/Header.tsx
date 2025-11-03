import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';

interface HeaderProps {
  showNavigation?: boolean;
}

const Header = ({ showNavigation = true }: HeaderProps) => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleNavigate = (path: string) => {
    setIsDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsDrawerOpen(false);
    navigate('/login');
  };

  return (
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
          Automations
        </Typography>
        {showNavigation && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={toggleDrawer}
              sx={{ color: 'white', p: 1 }}
            >
              <AccountCircleIcon />
            </IconButton>
            <Drawer
              anchor="right"
              open={isDrawerOpen}
              onClose={toggleDrawer}
              PaperProps={{
                sx: {
                  width: 280,
                  bgcolor: 'background.paper',
                }
              }}
            >
              <Box sx={{ py: 2 }}>
                <List>
                  <ListItem onClick={() => handleNavigate('/home')} sx={{ cursor: 'pointer' }}>
                    <ListItemIcon>
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                  </ListItem>
                  <Divider />
                  <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                    <ListItemIcon>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItem>
                </List>
              </Box>
            </Drawer>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;