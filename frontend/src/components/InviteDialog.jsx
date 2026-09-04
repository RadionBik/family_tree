import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import familyTreeService from "../services/familyTreeService";

// Admin creates a one-time invite link and sends it by hand.
const InviteDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const create = async () => {
    try {
      const invite = await familyTreeService.createInvite();
      setLink(`${window.location.origin}/invite/${invite.token}`);
      setCopied(false);
    } catch (err) {
      setError(err.response?.data?.detail || t("edit.errorSave"));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("invite.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {t("invite.explain")}
          </Typography>
          {link ? (
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                value={link}
                slotProps={{ input: { readOnly: true } }}
              />
              <Button variant="outlined" onClick={copy}>
                {copied ? t("invite.copied") : t("invite.copy")}
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              onClick={create}
              sx={{ alignSelf: "flex-start" }}
            >
              {t("invite.create")}
            </Button>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteDialog;
