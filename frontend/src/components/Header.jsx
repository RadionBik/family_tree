import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button"; // Import Button
import authService from "../services/authService"; // Import authService

// import AdminLogin from './AdminLogin'; // Keep commented out for public site

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isLoggedIn(); // Check auth status

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
    // Force a re-render or state update if necessary for the header to update immediately
    // For now, navigation should trigger a re-evaluation
  };

  return (
    // AppBar provides the main header structure and styling
    <AppBar position="static">
      {" "}
      {/* position="static" is default, can be changed */}
      <Toolbar>
        {/* Typography for the title */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t("header.title")}
        </Typography>

        {/* Logout Button */}
        <Box>
          {isAuthenticated && (
            <Button color="inherit" onClick={handleLogout}>
              {t("header.logoutButton", "Logout")}
            </Button>
          )}
          {/* The AdminLogin component is intentionally left out for the public site refactor */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
