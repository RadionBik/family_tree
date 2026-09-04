import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import familyTreeService from "../services/familyTreeService";

// Opened from a one-time invite link: pick a login and password, then straight in.
const InvitePage = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState(null); // null = checking
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    familyTreeService
      .checkInvite(token)
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await familyTreeService.acceptInvite(
        token,
        username,
        password,
      );
      localStorage.setItem("adminToken", data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || t("edit.errorSave"));
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("invite.pageTitle")}
        </Typography>
        {valid === false && (
          <Alert severity="warning">{t("invite.invalid")}</Alert>
        )}
        {valid && (
          <form onSubmit={submit}>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t("invite.pageExplain")}
              </Typography>
              <TextField
                label={t("invite.username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <TextField
                label={t("invite.password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" variant="contained">
                {t("invite.join")}
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default InvitePage;
