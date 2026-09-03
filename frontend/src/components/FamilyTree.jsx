import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import FamilyTreeGraph from "./FamilyTreeGraph";
import familyTreeService from "../services/familyTreeService";
import { ageOn } from "../utils/age";
import { toChartData, pickRoot } from "../utils/chartData";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";

const socialHref = {
  telegram: (v) => `https://t.me/${v.replace(/^@/, "")}`,
  vk: (v) => (v.startsWith("http") ? v : `https://vk.com/${v}`),
  instagram: (v) =>
    v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
  phone: (v) => `tel:${v.replace(/[^+\d]/g, "")}`,
};

const FamilyTree = ({ selectedMemberId, onMemberSelect }) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data, marriages } = useMemo(() => toChartData(members), [members]);
  const mainId =
    selectedMemberId || (members.length ? pickRoot(members).id : null);

  useEffect(() => {
    let isMounted = true;
    familyTreeService
      .getFamilyTreeData()
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res)) setMembers(res);
        else setError(t("familyTree.errorInvalidData"));
      })
      .catch(() => isMounted && setError(t("familyTree.errorLoading")))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [t]);

  const renderMemberDetails = () => {
    if (!selectedMemberId) return null;
    const m = members.find((x) => x.id === selectedMemberId);
    if (!m) return null;

    const age = ageOn(m.birth_date, m.death_date);
    const ageString =
      age === null
        ? null
        : `${t("years", "{{count}} years", { count: age })}${
            m.death_date
              ? ` ${t("ageAtDeathSuffix", "(at time of death)")}`
              : ""
          }`;
    const rows = [
      ["middleName", m.middle_name],
      ["maidenName", m.maiden_name],
      ["birthDate", m.birth_date],
      ["birthPlace", m.birth_place],
      ["deathDate", m.death_date],
      ["ageLabel", ageString],
      ["locationLabel", m.location],
      ["profession", m.profession],
      ["notes", m.notes],
    ].filter(([, value]) => value);
    const contacts = ["phone", "telegram", "vk", "instagram"].filter(
      (k) => m[k],
    );

    return (
      <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Avatar src={m.photo_url || undefined} sx={{ width: 56, height: 56 }}>
            {m.first_name[0]}
          </Avatar>
          <Typography variant="h6">{m.name}</Typography>
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
              {t("contacts", "Contacts")}:
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
        <Button
          variant="outlined"
          size="small"
          onClick={() => onMemberSelect(null)}
          sx={{ mt: 1 }}
        >
          {t("close")}
        </Button>
      </Paper>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {t("familyTree.title")}
      </Typography>

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
            height: "min(75vh, 800px)",
            minHeight: 400,
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

      {renderMemberDetails()}
    </Paper>
  );
};

export default FamilyTree;
