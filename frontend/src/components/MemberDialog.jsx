import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import familyTreeService from "../services/familyTreeService";

// Field name -> input type. Labels come from the same i18n keys the details panel uses.
const FIELDS = [
  ["first_name", "text"],
  ["last_name", "text"],
  ["middle_name", "text"],
  ["maiden_name", "text"],
  ["gender", "select"],
  ["birth_date", "date"],
  ["death_date", "date"],
  ["birth_place", "text"],
  ["locationLabel", "text", "location"],
  ["profession", "text"],
  ["phone", "text"],
  ["telegram", "text"],
  ["vk", "text"],
  ["instagram", "text"],
  ["photo_url", "text"],
  ["notes", "multiline"],
];

const empty = () =>
  Object.fromEntries(FIELDS.map(([key, , field]) => [field || key, ""]));

// `member` null = create, otherwise edit. onSaved(savedMember) after a successful write.
const MemberDialog = ({ open, member, onClose, onSaved }) => {
  const { t } = useTranslation();
  // Mounted only while open (see FamilyTree), so the initial state is the form state.
  const [form, setForm] = useState(() => {
    const base = empty();
    if (member) Object.keys(base).forEach((k) => (base[k] = member[k] ?? ""));
    return base;
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]),
    );
    try {
      const saved = member
        ? await familyTreeService.updateMember(member.id, payload)
        : await familyTreeService.createMember(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err.response?.data?.detail || t("edit.errorSave", "Save failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>
          {member
            ? t("edit.editTitle", "Edit")
            : t("edit.addTitle", "Add a person")}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {FIELDS.map(([key, type, fieldName]) => {
              const field = fieldName || key;
              const common = {
                fullWidth: true,
                size: "small",
                label: t(key),
                value: form[field] ?? "",
                onChange: (e) => setForm({ ...form, [field]: e.target.value }),
              };
              return (
                <Grid
                  key={field}
                  size={{ xs: 12, sm: type === "multiline" ? 12 : 6 }}
                >
                  {type === "select" ? (
                    <TextField select {...common}>
                      <MenuItem value="">—</MenuItem>
                      <MenuItem value="MALE">{t("gender.male")}</MenuItem>
                      <MenuItem value="FEMALE">{t("gender.female")}</MenuItem>
                      <MenuItem value="OTHER">{t("gender.other")}</MenuItem>
                    </TextField>
                  ) : (
                    <TextField
                      {...common}
                      required={field === "first_name"}
                      type={type === "date" ? "date" : "text"}
                      multiline={type === "multiline"}
                      minRows={type === "multiline" ? 3 : undefined}
                      InputLabelProps={
                        type === "date" ? { shrink: true } : undefined
                      }
                    />
                  )}
                </Grid>
              );
            })}
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("close")}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {t("edit.save", "Save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MemberDialog;
