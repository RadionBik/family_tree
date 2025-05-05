import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container'; // Using Container for centered content with max-width
import Header from './Header'; // Will be refactored next
import Footer from './Footer'; // Will be refactored next

const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        // bgcolor: 'background.default' // Theme handles background color via CssBaseline
      }}
    >
      <Header />
      {/* Using Container to provide max-width and centering for the main content */}
      {/* Adjust maxWidth (xs, sm, md, lg, xl, false) as needed or remove for full width */}
      <Container
        component="main" // Use main semantic tag
        maxWidth="lg" // Example: limit width, set to false for full width
        sx={{
          flexGrow: 1, // Allows content to grow and push footer down
          py: 2, // Vertical padding (theme spacing units)
          mt: 2, // Margin top (theme spacing units) - Adjust as needed
          mb: 2, // Margin bottom
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;