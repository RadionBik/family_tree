import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import FamilyTreeGraph from "./FamilyTreeGraph";
import GraphLegend from "./GraphLegend";
import familyTreeService from "../services/familyTreeService";
import { ageOn, lifeYears } from "../utils/age";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

// Members -> Cytoscape elements. Every couple (or parent set) gets a small
// "union" node: partners feed into it, children hang from it. That keeps
// spouses on one row and gives siblings a single shared drop line.
const buildElements = (members) => {
  const ids = new Set(members.map((m) => m.id));
  const nodes = members.map((m) => ({
    data: {
      id: m.id,
      label: m.name,
      display: [m.name, lifeYears(m.birth_date, m.death_date)]
        .filter(Boolean)
        .join("\n"),
      gender: m.gender,
      birth_date: m.birth_date,
      death_date: m.death_date,
      deceased: Boolean(m.death_date),
      location: m.location,
      notes: m.notes,
    },
  }));

  const parentsOf = new Map(); // child id -> Set(parent id)
  const couples = new Set(); // "a|b", sorted
  members.forEach((m) =>
    m.relationships_from.forEach((r) => {
      if (!ids.has(r.to_member_id)) return;
      if (r.relation_type === "PARENT") {
        if (!parentsOf.has(r.to_member_id))
          parentsOf.set(r.to_member_id, new Set());
        parentsOf.get(r.to_member_id).add(m.id);
      } else if (r.relation_type === "SPOUSE") {
        couples.add([m.id, r.to_member_id].sort().join("|"));
      }
    }),
  );

  const edges = [];
  const unions = new Set();
  const union = (parentIds) => {
    const id = `u|${[...parentIds].sort().join("|")}`;
    if (!unions.has(id)) {
      unions.add(id);
      nodes.push({ data: { id, union: true } });
      parentIds.forEach((p) =>
        edges.push({
          data: { id: `${p}>${id}`, source: p, target: id, kind: "partner" },
        }),
      );
    }
    return id;
  };
  couples.forEach((key) => union(key.split("|")));
  parentsOf.forEach((parents, child) => {
    const u = union(parents);
    edges.push({
      data: { id: `${u}>${child}`, source: u, target: child, kind: "child" },
    });
  });
  return [...nodes, ...edges];
};

const FamilyTree = ({ selectedMemberId, onMemberSelect }) => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const elements = useMemo(() => buildElements(members), [members]);

  const handleNodeClick = (nodeData) => {
    if (!onMemberSelect) return;
    onMemberSelect(
      nodeData && nodeData.id !== selectedMemberId ? nodeData.id : null,
    );
  };

  useEffect(() => {
    let isMounted = true;
    familyTreeService
      .getFamilyTreeData()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) setMembers(data);
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

    const placeholder = t("common.noData", "No data");
    const age = ageOn(m.birth_date, m.death_date);
    const ageString =
      age === null
        ? placeholder
        : `${t("years", "{{count}} years", { count: age })}${
            m.death_date
              ? ` ${t("ageAtDeathSuffix", "(at time of death)")}`
              : ""
          }`;
    const rows = [
      [t("name", "Name"), m.name],
      [t("birthDate", "Born"), m.birth_date || placeholder],
      [t("deathDate", "Died"), m.death_date || placeholder],
      [
        t("genderLabel", "Gender"),
        m.gender
          ? t(`gender.${m.gender.toLowerCase()}`, m.gender)
          : placeholder,
      ],
      [t("ageLabel", "Age"), ageString],
      [t("locationLabel", "Location"), m.location || placeholder],
      m.notes ? [t("notes", "Notes"), m.notes] : null,
    ].filter(Boolean);

    return (
      <Paper elevation={1} sx={{ marginTop: 3, padding: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("familyTree.detailsTitle", "Details")}
        </Typography>
        {rows.map(([label, value]) => (
          <Typography key={label} variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {label}:
            </Typography>{" "}
            {value}
          </Typography>
        ))}
        <Button
          variant="outlined"
          size="small"
          onClick={() => onMemberSelect(null)}
          sx={{ marginTop: 1 }}
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

      {!loading && !error && elements.length > 0 && (
        <>
          <Box
            sx={{
              height: "min(75vh, 800px)",
              minHeight: 400,
              border: "1px solid",
              borderColor: "divider",
              mb: 2,
              overflow: "hidden",
            }}
          >
            <FamilyTreeGraph
              elements={elements}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedMemberId}
            />
          </Box>
          <GraphLegend />
        </>
      )}
      {!loading && !error && elements.length === 0 && (
        <Typography sx={{ mt: 2 }}>{t("familyTree.noData")}</Typography>
      )}

      {renderMemberDetails()}
    </Paper>
  );
};

export default FamilyTree;
