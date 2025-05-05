import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// A basic theme instance.
// We can customize this further later.
const theme = createTheme({
  palette: {
    // mode: 'light', // We can dynamically set this later
    primary: {
      main: '#556cd6', // Example primary color
    },
    secondary: {
      main: '#19857b', // Example secondary color
    },
    error: {
      main: red.A400,
    },
    background: {
      // Default background colors will be used based on mode
      // default: '#fff', // Example for light mode
      // paper: '#fff', // Example for light mode
    },
  },
  typography: {
    fontFamily: [
      'system-ui',
      'Avenir',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    // You can customize variants like h1, body1, etc. here
  },
  // You can add component overrides here if needed
  // components: {
  //   MuiButton: {
  //     styleOverrides: {
  //       root: {
  //         borderRadius: 8,
  //       },
  //     },
  //   },
  // },
});

export default theme;