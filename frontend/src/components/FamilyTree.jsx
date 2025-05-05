import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FamilyTreeGraph from "./FamilyTreeGraph"; // Import the graph component
import GraphLegend from "./GraphLegend"; // Import the legend component
import familyTreeService from "../services/familyTreeService"; // Import the service
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

// Helper function to transform API data to Cytoscape format (remains the same)
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

      if (sourceMember && sourceMember.is_descendant === true) {
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

// Accept selectedMemberId and onMemberSelect from HomePage
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

    return (
      <Paper elevation={1} sx={{ marginTop: 3, padding: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t("familyTree.detailsTitle")}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Typography component="span" fontWeight="bold">
            {t("name")}:
          </Typography>{" "}
          {memberData.label}
        </Typography>
        {memberData.birth_date && (
          <Typography variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t("birthDate")}:
            </Typography>{" "}
            {memberData.birth_date}
          </Typography>
        )}
        {memberData.death_date && (
          <Typography variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t("deathDate")}:
            </Typography>{" "}
            {memberData.death_date}
          </Typography>
        )}
        {memberData.gender && (
          <Typography variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t("genderLabel")}:
            </Typography>{" "}
            {t(`gender.${memberData.gender}`, memberData.gender)}
          </Typography>
        )}
        {memberData.notes && (
          <Typography variant="body1" gutterBottom>
            <Typography component="span" fontWeight="bold">
              {t("notes")}:
            </Typography>{" "}
            {memberData.notes}
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
    // Use Paper for the main container
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
          {/* Container for the graph itself - adjust height, ensure width is 100% */}
          <Box
            sx={{
              height: "500px", // Keep height or adjust as needed
              border: "1px solid",
              borderColor: "divider",
              mb: 2, // Margin bottom before legend
              position: "relative", // Needed for Cytoscape positioning?
              width: "100%", // Explicitly set width
              overflow: "hidden", // Hide potential overflow if graph is slightly too large
              boxSizing: "border-box", // Ensure border is included in width/height
            }}
          >
            <FamilyTreeGraph
              elements={elements}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedMemberId}
            />
          </Box>
          {/* Add some margin/padding to the legend container if needed */}
          <Box sx={{ pl: 1 }}>
            {" "}
            {/* Optional: Slight padding-left for legend */}
            <GraphLegend />
          </Box>
        </>
      )}
      {!loading && !error && elements.length === 0 && (
        <Typography sx={{ mt: 2 }}>{t("familyTree.noData")}</Typography>
      )}

      {/* Render Member Details */}
      {renderMemberDetails()}
    </Paper>
  );
};

export default FamilyTree;
