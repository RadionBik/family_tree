import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import familyTreeService from "../services/familyTreeService";

// Adds a relation for `member`: "parent" = other is the parent, "child" = other is
// the child, "spouse" = couple. Stored as PARENT/SPOUSE rows.
const RelationDialog = ({ open, member, members, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [kind, setKind] = useState("parent");
  const [other, setOther] = useState(null);
  const [date, setDate] = useState("");
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!other) return;
    const body =
      kind === "spouse"
        ? {
            from_member_id: member.id,
            to_member_id: other.id,
            relation_type: "SPOUSE",
            start_date: date || null,
          }
        : {
            from_member_id: kind === "parent" ? other.id : member.id,
            to_member_id: kind === "parent" ? member.id : other.id,
            relation_type: "PARENT",
          };
    try {
      await familyTreeService.addRelation(body);
      setOther(null);
      setDate("");
      onSaved();
    } catch (err) {
      setError(
        err.response?.data?.detail || t("edit.errorSave", "Save failed"),
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit}>
        <DialogTitle>{t("edit.addRelation", "Add a relation")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              size="small"
              label={t("edit.relationKind", "Who is the other person")}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <MenuItem value="parent">
                {t("relation.parentOf", "parent")}
              </MenuItem>
              <MenuItem value="child">
                {t("relation.childOf", "child")}
              </MenuItem>
              <MenuItem value="spouse">
                {t("relation.spouse", "spouse")}
              </MenuItem>
            </TextField>
            <Autocomplete
              options={members.filter((m) => m.id !== member?.id)}
              getOptionLabel={(m) => m.name}
              value={other}
              onChange={(e, v) => setOther(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label={t("name")}
                  required
                />
              )}
            />
            {kind === "spouse" && (
              <TextField
                size="small"
                type="date"
                label={t("edit.marriageDate", "Marriage date")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("close")}</Button>
          <Button type="submit" variant="contained" disabled={!other}>
            {t("edit.save", "Save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RelationDialog;
