import React from 'react';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'; // Using Box for potential future elements

// import AdminLogin from './AdminLogin'; // Keep commented out for public site

const Header = () => {
  const { t } = useTranslation();

  return (
    // AppBar provides the main header structure and styling
    <AppBar position="static"> {/* position="static" is default, can be changed */}
      <Toolbar>
        {/* Typography for the title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('header.title')}
        </Typography>

        {/* Placeholder for potential future buttons or elements */}
        <Box>
          {/* Example: <Button color="inherit">Login</Button> */}
          {/* The AdminLogin component is intentionally left out for the public site refactor */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;