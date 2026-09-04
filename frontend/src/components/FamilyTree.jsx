import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import FamilyTreeGraph from "./FamilyTreeGraph";
import MemberDialog from "./MemberDialog";
import RelationDialog from "./RelationDialog";
import familyTreeService from "../services/familyTreeService";
import authService from "../services/authService";
import { ageOn } from "../utils/age";
import { toChartData, pickRoot } from "../utils/chartData";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";

const socialHref = {
  telegram: (v) => `https://t.me/${v.replace(/^@/, "")}`,
  vk: (v) => (v.startsWith("http") ? v : `https://vk.com/${v}`),
  instagram: (v) =>
    v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  phone: (v) => `tel:${v.replace(/[^+\d]/g, "")}`,
};

// Relations of one person as rows: [kind, relation, other member].
const relationRows = (m, byId) => {
  const rows = [];
  m.relationships_to.forEach((r) => {
    if (r.relation_type === "PARENT")
      rows.push(["parent", r, byId.get(r.from_member_id)]);
    if (r.relation_type === "SPOUSE")
      rows.push(["spouse", r, byId.get(r.from_member_id)]);
  });
  m.relationships_from.forEach((r) => {
    if (r.relation_type === "PARENT")
      rows.push(["child", r, byId.get(r.to_member_id)]);
    if (r.relation_type === "SPOUSE")
      rows.push(["spouse", r, byId.get(r.to_member_id)]);
  });
  return rows.filter(([, , other]) => other);
};

const FamilyTree = ({
  members,
  loading,
  error,
  selectedMemberId,
  onMemberSelect,
  onChanged,
}) => {
  const { t } = useTranslation();
  const isAdmin = authService.isAdmin();
  const [dialog, setDialog] = useState(null); // "add" | "edit" | "relation"
  const [actionError, setActionError] = useState(null);

  const { data, marriages } = useMemo(() => toChartData(members), [members]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const mainId =
    selectedMemberId || (members.length ? pickRoot(members).id : null);
  const selected = selectedMemberId ? byId.get(selectedMemberId) : null;

  const afterWrite = async (focusId) => {
    setDialog(null);
    setActionError(null);
    await onChanged();
    if (focusId !== undefined) onMemberSelect(focusId);
  };

  const removeRelation = async (id) => {
    try {
      await familyTreeService.removeRelation(id);
      await afterWrite();
    } catch (err) {
      setActionError(err.response?.data?.detail || t("edit.errorSave"));
    }
  };

  const deleteMember = async () => {
    if (!window.confirm(t("edit.confirmDelete", { name: selected.name })))
      return;
    try {
      await familyTreeService.deleteMember(selected.id);
      await afterWrite(null);
    } catch (err) {
      setActionError(err.response?.data?.detail || t("edit.errorSave"));
    }
  };

  const renderDetails = () => {
    if (!selected) return null;
    const m = selected;
    const age = ageOn(m.birth_date, m.death_date);
    const ageString =
      age === null
        ? null
        : `${t("years", { count: age })}${m.death_date ? ` ${t("ageAtDeathSuffix")}` : ""}`;
    const rows = [
      ["middle_name", m.middle_name],
      ["maiden_name", m.maiden_name],
      ["birth_date", m.birth_date],
      ["birth_place", m.birth_place],
      ["death_date", m.death_date],
      ["ageLabel", ageString],
      ["locationLabel", m.location],
      ["profession", m.profession],
      ["notes", m.notes],
    ].filter(([, value]) => value);
    const contacts = ["phone", "telegram", "vk", "instagram"].filter(
      (k) => m[k],
    );
    const relations = relationRows(m, byId);

    return (
      <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Avatar src={m.photo_url || undefined} sx={{ width: 56, height: 56 }}>
            {m.first_name[0]}
          </Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {m.name}
          </Typography>
          {isAdmin && (
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setDialog("edit")}>
                {t("edit.edit")}
              </Button>
              <Button size="small" color="error" onClick={deleteMember}>
                {t("edit.delete")}
              </Button>
            </Stack>
          )}
        </Box>
        {rows.map(([key, value]) => (
          <Typography key={key} variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t(key)}:
            </Typography>{" "}
            {value}
          </Typography>
        ))}
        {contacts.length > 0 && (
          <Typography variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t("contacts")}:
            </Typography>{" "}
            {contacts.map((k, i) => (
              <React.Fragment key={k}>
                {i > 0 && " · "}
                <Link
                  href={socialHref[k](m[k])}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t(k)}
                </Link>
              </React.Fragment>
            ))}
          </Typography>
        )}

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          {t("relation.title")}
        </Typography>
        {relations.length === 0 && (
          <Typography color="text.secondary">{t("relation.none")}</Typography>
        )}
        {relations.map(([kind, r, other]) => (
          <Box
            key={r.id}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Typography
              variant="body2"
              sx={{ minWidth: 90 }}
              color="text.secondary"
            >
              {t(`relation.${kind}`)}
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => onMemberSelect(other.id)}
            >
              {other.name}
            </Link>
            {kind === "spouse" && r.start_date && (
              <Typography variant="body2" color="text.secondary">
                ({r.start_date.slice(0, 4)})
              </Typography>
            )}
            {isAdmin && (
              <IconButton
                size="small"
                aria-label={t("edit.removeRelation")}
                onClick={() => removeRelation(r.id)}
              >
                ×
              </IconButton>
            )}
          </Box>
        ))}
        {actionError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {actionError}
          </Alert>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {isAdmin && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setDialog("relation")}
            >
              {t("edit.addRelation")}
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            onClick={() => onMemberSelect(null)}
          >
            {t("close")}
          </Button>
        </Stack>
      </Paper>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
          {t("familyTree.title")}
        </Typography>
        {isAdmin && (
          <Button
            size="small"
            variant="contained"
            onClick={() => setDialog("add")}
          >
            {t("edit.addPerson")}
          </Button>
        )}
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && data.length > 0 && (
        <Box
          sx={{
            height: "75vh",
            minHeight: 500,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <FamilyTreeGraph
            data={data}
            marriages={marriages}
            mainId={mainId}
            onMainChange={onMemberSelect}
          />
        </Box>
      )}
      {!loading && !error && data.length === 0 && (
        <Typography sx={{ mt: 2 }}>{t("familyTree.noData")}</Typography>
      )}

      {renderDetails()}

      {(dialog === "add" || dialog === "edit") && (
        <MemberDialog
          open
          member={dialog === "edit" ? selected : null}
          onClose={() => setDialog(null)}
          onSaved={(saved) => afterWrite(saved.id)}
        />
      )}
      {selected && dialog === "relation" && (
        <RelationDialog
          open
          member={selected}
          members={members}
          onClose={() => setDialog(null)}
          onSaved={() => afterWrite()}
        />
      )}
    </Paper>
  );
};

export default FamilyTree;
