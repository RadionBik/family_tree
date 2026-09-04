import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Link from "@mui/material/Link";
import familyTreeService from "../services/familyTreeService";

const dayLabel = (iso) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

// `version` bumps after every edit so the log refetches.
const ChangeLog = ({ version, onMemberSelect }) => {
  const { t } = useTranslation();
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    familyTreeService
      .getChanges()
      .then(setChanges)
      .catch(() => setChanges([]));
  }, [version]);

  const days = [];
  changes.forEach((c) => {
    const day = c.changed_at.slice(0, 10);
    const last = days[days.length - 1];
    if (last && last.day === day) last.items.push(c);
    else days.push({ day, items: [c] });
  });

  const name = (id, label) =>
    id ? (
      <Link
        component="button"
        variant="body2"
        onClick={() => onMemberSelect(id)}
      >
        {label}
      </Link>
    ) : (
      label
    );

  const describe = (c) => {
    const who = name(c.entity_id, c.subject);
    if (c.entity === "relation") {
      const other = name(c.other_id, c.other);
      const spouses = c.relation_type === "SPOUSE";
      return (
        <>
          {c.kind === "removed" && `${t("log.relationRemoved")}: `}
          {who} {spouses ? t("log.and") : t("log.parentOf")} {other}
          {spouses && ` ${t("log.spouses")}`}
        </>
      );
    }
    if (c.kind === "added")
      return (
        <>
          {t("log.added")}: {who}
        </>
      );
    if (c.kind === "removed")
      return (
        <>
          {t("log.removed")}: {c.subject}
        </>
      );
    const field = t(
      c.field === "location" ? "locationLabel" : c.field,
      c.field,
    );
    return (
      <>
        {who}: {field.toLowerCase()} «{c.old ?? "—"}» → «{c.new ?? "—"}»
      </>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {t("log.title")}
      </Typography>
      {days.length === 0 && (
        <Typography color="text.secondary">{t("log.empty")}</Typography>
      )}
      {days.map(({ day, items }, i) => (
        <Accordion key={day} defaultExpanded={i === 0} disableGutters>
          <AccordionSummary>
            <Typography sx={{ flexGrow: 1 }}>{dayLabel(day)}</Typography>
            <Typography color="text.secondary">
              {t("log.count", { count: items.length })}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <List dense disablePadding>
              {items.map((c) => (
                <ListItem key={c.id} disableGutters>
                  <ListItemText
                    primary={describe(c)}
                    secondary={`${c.changed_at.slice(11, 16)}${c.author ? ` · ${c.author}` : ""}`}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  );
};

export default ChangeLog;
