import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { ageOn, lifeYears } from "../utils/age";

const socialHref = {
  telegram: (v) => `https://t.me/${v.replace(/^@/, "")}`,
  vk: (v) => (v.startsWith("http") ? v : `https://vk.com/${v}`),
  instagram: (v) =>
    v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  phone: (v) => `tel:${v.replace(/[^+\d]/g, "")}`,
};

// Relations of one person grouped for display: parents, spouses, children.
const groupRelations = (m, byId) => {
  const groups = { parents: [], spouses: [], children: [] };
  m.relationships_to.forEach((r) => {
    const other = byId.get(r.from_member_id);
    if (!other) return;
    if (r.relation_type === "PARENT") groups.parents.push([r, other]);
    if (r.relation_type === "SPOUSE") groups.spouses.push([r, other]);
  });
  m.relationships_from.forEach((r) => {
    const other = byId.get(r.to_member_id);
    if (!other) return;
    if (r.relation_type === "PARENT") groups.children.push([r, other]);
    if (r.relation_type === "SPOUSE") groups.spouses.push([r, other]);
  });
  return groups;
};

// Side panel next to the tree: the selected person, their relations, and the
// admin actions. Without a selection it explains what to do.
const MemberPanel = ({
  member,
  byId,
  isAdmin,
  error,
  onSelect,
  onCenter,
  isCentered,
  onEdit,
  onDelete,
  onAddRelation,
  onRemoveRelation,
  onAddPerson,
}) => {
  const { t } = useTranslation();

  if (!member) {
    return (
      <Stack spacing={2} sx={{ p: 1 }}>
        <Typography color="text.secondary">{t("panel.hint")}</Typography>
        {isAdmin && (
          <Button variant="contained" onClick={onAddPerson}>
            {t("edit.addPerson")}
          </Button>
        )}
      </Stack>
    );
  }

  const m = member;
  const age = ageOn(m.birth_date, m.death_date);
  const rows = [
    ["middle_name", m.middle_name],
    ["maiden_name", m.maiden_name],
    ["birth_date", m.birth_date],
    ["birth_place", m.birth_place],
    ["death_date", m.death_date],
    [
      "ageLabel",
      age === null
        ? null
        : `${t("years", { count: age })}${m.death_date ? ` ${t("ageAtDeathSuffix")}` : ""}`,
    ],
    ["locationLabel", m.location],
    ["profession", m.profession],
    ["notes", m.notes],
  ].filter(([, value]) => value);
  const contacts = ["phone", "telegram", "vk", "instagram"].filter((k) => m[k]);
  const groups = groupRelations(m, byId);
  const hasRelations = Object.values(groups).some((g) => g.length);

  return (
    <Stack spacing={2} sx={{ p: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar src={m.photo_url || undefined} sx={{ width: 56, height: 56 }}>
          {m.first_name[0]}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
            {m.name}
          </Typography>
          <Typography color="text.secondary">
            {lifeYears(m.birth_date, m.death_date)}
          </Typography>
        </Box>
      </Box>

      <Button
        size="small"
        variant="outlined"
        onClick={onCenter}
        disabled={isCentered}
      >
        {t("tree.center")}
      </Button>

      {isAdmin && (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={onEdit}>
            {t("edit.edit")}
          </Button>
          <Button size="small" variant="outlined" onClick={onAddRelation}>
            {t("edit.addRelation")}
          </Button>
          <Button size="small" color="error" onClick={onDelete}>
            {t("edit.delete")}
          </Button>
        </Stack>
      )}

      {rows.length > 0 && (
        <Box>
          {rows.map(([key, value]) => (
            <Typography key={key} variant="body2" gutterBottom>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                {t(key)}:
              </Typography>{" "}
              {value}
            </Typography>
          ))}
          {contacts.length > 0 && (
            <Typography variant="body2">
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
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
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {t("relation.title")}
        </Typography>
        {!hasRelations && (
          <Typography variant="body2" color="text.secondary">
            {isAdmin ? t("panel.noRelationsAdmin") : t("relation.none")}
          </Typography>
        )}
        {["parents", "spouses", "children"].map(
          (group) =>
            groups[group].length > 0 && (
              <Box key={group} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t(`relation.${group}`)}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ flexWrap: "wrap", mt: 0.5 }}
                >
                  {groups[group].map(([r, other]) => (
                    <Chip
                      key={r.id}
                      label={
                        group === "spouses" && r.start_date
                          ? `${other.name} (${r.start_date.slice(0, 4)})`
                          : other.name
                      }
                      onClick={() => onSelect(other.id)}
                      onDelete={
                        isAdmin ? () => onRemoveRelation(r.id) : undefined
                      }
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            ),
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      <Button
        size="small"
        onClick={() => onSelect(null)}
        sx={{ alignSelf: "flex-start" }}
      >
        {t("close")}
      </Button>
    </Stack>
  );
};

export default MemberPanel;
