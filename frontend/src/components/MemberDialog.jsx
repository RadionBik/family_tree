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
import Typography from "@mui/material/Typography";
import familyTreeService from "../services/familyTreeService";

// Sections of the form: [section key, [[field, label key, type, grid columns], ...]]
const SECTIONS = [
  [
    "name",
    [
      ["last_name", "last_name", "text", 4],
      ["first_name", "first_name", "text", 4],
      ["middle_name", "middle_name", "text", 4],
      ["maiden_name", "maiden_name", "text", 6],
      ["gender", "genderLabel", "select", 6],
    ],
  ],
  [
    "life",
    [
      ["birth_date", "birth_date", "date", 6],
      ["birth_place", "birth_place", "text", 6],
      ["death_date", "death_date", "date", 6],
      ["location", "locationLabel", "text", 6],
      ["profession", "profession", "text", 12],
    ],
  ],
  [
    "contacts",
    [
      ["phone", "phone", "text", 6],
      ["telegram", "telegram", "text", 6],
      ["vk", "vk", "text", 6],
      ["instagram", "instagram", "text", 6],
    ],
  ],
  [
    "other",
    [
      ["photo_url", "photo_url", "text", 12],
      ["notes", "notes", "multiline", 12],
    ],
  ],
];
const FIELDS = SECTIONS.flatMap(([, fields]) => fields.map(([f]) => f));

// `member` null = create, otherwise edit. Mounted only while open, so the
// initial state is the form state. onSaved(savedMember) after a write.
const MemberDialog = ({ open, member, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f, member?.[f] ?? ""])),
  );
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
      setError(err.response?.data?.detail || t("edit.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>
          {member ? t("edit.editTitle") : t("edit.addTitle")}
        </DialogTitle>
        <DialogContent>
          {SECTIONS.map(([section, fields]) => (
            <Grid container spacing={1.5} key={section} sx={{ mb: 2 }}>
              <Grid size={12}>
                <Typography variant="overline" color="text.secondary">
                  {t(`edit.section.${section}`)}
                </Typography>
              </Grid>
              {fields.map(([field, labelKey, type, cols]) => (
                <Grid key={field} size={{ xs: 12, sm: cols }}>
                  <TextField
                    fullWidth
                    size="small"
                    select={type === "select"}
                    label={t(labelKey)}
                    value={form[field] ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.value })
                    }
                    required={field === "first_name"}
                    type={type === "date" ? "date" : "text"}
                    multiline={type === "multiline"}
                    minRows={type === "multiline" ? 3 : undefined}
                    slotProps={
                      type === "date"
                        ? { inputLabel: { shrink: true } }
                        : undefined
                    }
                  >
                    {type === "select" && [
                      <MenuItem key="" value="">
                        —
                      </MenuItem>,
                      <MenuItem key="MALE" value="MALE">
                        {t("gender.male")}
                      </MenuItem>,
                      <MenuItem key="FEMALE" value="FEMALE">
                        {t("gender.female")}
                      </MenuItem>,
                      <MenuItem key="OTHER" value="OTHER">
                        {t("gender.other")}
                      </MenuItem>,
                    ]}
                  </TextField>
                </Grid>
              ))}
            </Grid>
          ))}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("close")}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {t("edit.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MemberDialog;
