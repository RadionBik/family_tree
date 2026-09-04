import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import authService from "../services/authService";
import InviteDialog from "./InviteDialog";

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isLoggedIn();
  const [invite, setInvite] = useState(false);

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
          {isAuthenticated && authService.isAdmin() && (
            <Button color="inherit" onClick={() => setInvite(true)}>
              {t("invite.button")}
            </Button>
          )}
          {isAuthenticated && (
            <Button color="inherit" onClick={handleLogout}>
              {t("header.logoutButton", "Logout")}
            </Button>
          )}
        </Box>
        {invite && <InviteDialog open onClose={() => setInvite(false)} />}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
