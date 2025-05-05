import React from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container'; // Optional: To align with main content width

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer" // Use footer semantic tag
      sx={{
        py: 2, // Padding top and bottom (theme spacing units)
        px: 2, // Padding left and right
        mt: 'auto', // Pushes footer to the bottom when content is short
        backgroundColor: (theme) => // Example: Use theme palette
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      {/* Optional: Use Container to constrain width like in Layout */}
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {t('footer.copyright', { year: currentYear })}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;