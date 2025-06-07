import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import authService from "../services/authService";

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isLoggedIn();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      {" "}
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t("header.title")}
        </Typography>

        <Box>
          {isAuthenticated && (
            <Button color="inherit" onClick={handleLogout}>
              {t("header.logoutButton", "Logout")}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
