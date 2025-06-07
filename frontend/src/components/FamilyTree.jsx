import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FamilyTreeGraph from "./FamilyTreeGraph";
import GraphLegend from "./GraphLegend";
import familyTreeService from "../services/familyTreeService";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

const transformDataForCytoscape = (members) => {
  const elements = [];
  const edgeIds = new Set();
  const memberMap = new Map(members.map((m) => [String(m.id), m]));

  members.forEach((member) => {
    elements.push({
      data: {
        id: String(member.id),
        label: member.name,
        gender: member.gender,
        birth_date: member.birth_date,
        death_date: member.death_date,
        notes: member.notes,
        is_descendant: member.is_descendant,
      },
    });
  });

  members.forEach((member) => {
    member.relationships_from.forEach((relation) => {
      const edgeId = `rel-${relation.id}`;
      const sourceId = String(relation.from_member_id);
      const targetId = String(relation.to_member_id);
      const sourceMember = memberMap.get(sourceId);

      if (sourceMember) {
        if (!edgeIds.has(edgeId) && relation.relation_type !== "CHILD") {
          elements.push({
            data: {
              id: edgeId,
              source: sourceId,
              target: targetId,
              label: relation.relation_type,
            },
          });
          edgeIds.add(edgeId);
        }
      }
    });
  });
  return elements;
};

const FamilyTree = ({ selectedMemberId, onMemberSelect }) => {
  const { t } = useTranslation();
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleNodeClick = (nodeData) => {
    console.log(
      "Node clicked in FamilyTree, calling onMemberSelect:",
      nodeData,
    );
    if (onMemberSelect) {
      onMemberSelect(selectedMemberId === nodeData?.id ? null : nodeData?.id);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      try {
        const familyData = await familyTreeService.getFamilyTreeData();
        console.log("Fetched family data:", familyData);
        if (isMounted) {
          if (Array.isArray(familyData)) {
            const transformedElements = transformDataForCytoscape(familyData);
            setElements(transformedElements);
          } else {
            console.error("Fetched data is not an array:", familyData);
            setError(t("familyTree.errorInvalidData"));
            setElements([]);
          }
        }
      } catch (err) {
        console.error("Error fetching or transforming family tree data:", err);
        if (isMounted) {
          setError(t("familyTree.errorLoading"));
          setElements([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [t]);

  const renderMemberDetails = () => {
    if (!selectedMemberId) return null;

    const memberElement = elements.find(
      (el) => el.data.id === String(selectedMemberId),
    );
    const memberData = memberElement?.data;

    if (!memberData) {
      console.warn(
        `Member data not found in elements for ID: ${selectedMemberId}`,
      );
      return null;
    }

    const placeholder = t("common.noData", "No data");

    let ageString = placeholder;
    if (memberData.birth_date) {
      try {
        const birthDate = new Date(memberData.birth_date);
        const endDate = memberData.death_date
          ? new Date(memberData.death_date)
          : new Date();

        if (!isNaN(birthDate.getTime())) {
          let age = endDate.getFullYear() - birthDate.getFullYear();
          const monthDiff = endDate.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && endDate.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          if (age >= 0) {
            ageString = t("years", "{{count}} years", { count: age });

            if (memberData.death_date) {
              ageString += ` ${t("ageAtDeathSuffix", "(at time of death)")}`;
            }
          } else {
            console.warn(`Calculated negative age for node ${memberData.id}`);
            ageString = t("invalidDate", "Invalid date");
          }
        } else {
          console.warn(
            `Invalid birth date format for node ${memberData.id}: ${memberData.birth_date}`,
          );
          ageString = t("invalidDate", "Invalid date");
        }
      } catch (e) {
        console.error(`Error calculating age for node ${memberData.id}:`, e);
        ageString = t("ageCalculationError", "Error");
      }
    }

    return (
      <Paper elevation={1} sx={{ marginTop: 3, padding: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("familyTree.detailsTitle", "Details")}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Typography component="span" fontWeight="bold">
            {t("name", "Name")}:
          </Typography>{" "}
          {memberData.label || placeholder}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Typography component="span" fontWeight="bold">
            {t("birthDate", "Born")}:
          </Typography>{" "}
          {memberData.birth_date || placeholder}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Typography component="span" fontWeight="bold">
            {t("deathDate", "Died")}:
          </Typography>{" "}
          {memberData.death_date || placeholder}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Typography component="span" fontWeight="bold">
            {t("genderLabel", "Gender")}:
          </Typography>{" "}
          {memberData.gender
            ? t(`gender.${memberData.gender.toLowerCase()}`, memberData.gender)
            : placeholder}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Typography component="span" fontWeight="bold">
            {t("ageLabel", "Age")}:
          </Typography>{" "}
          {ageString}
        </Typography>
        {memberData.notes && (
          <Typography variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t("notes", "Notes")}:
            </Typography>{" "}
            {memberData.notes}{" "}
          </Typography>
        )}
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
              height: "500px",
              border: "1px solid",
              borderColor: "divider",
              mb: 2,
              position: "relative",
              width: "100%",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <FamilyTreeGraph
              elements={elements}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedMemberId}
            />
          </Box>
          <Box sx={{ pl: 1 }}>
            {" "}
            <GraphLegend />
          </Box>
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
