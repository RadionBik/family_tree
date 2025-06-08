import React from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { GRAPH } from "../graphTheme";

const Card = ({ colors, dashed }) => (
  <Box
    component="span"
    sx={{
      width: 22,
      height: 14,
      borderRadius: "4px",
      bgcolor: colors.bg,
      border: `2px ${dashed ? "dashed" : "solid"} ${colors.border}`,
      display: "inline-block",
      mr: 1,
      verticalAlign: "middle",
    }}
  />
);

const Line = ({ color, arrow }) => (
  <Box
    component="span"
    sx={{
      width: 28,
      borderTop: `2px solid ${color}`,
      display: "inline-block",
      mr: 1,
      verticalAlign: "middle",
      position: "relative",
      "&::after": arrow
        ? {
            content: '""',
            position: "absolute",
            right: -2,
            top: -5,
            borderTop: `4px solid transparent`,
            borderBottom: `4px solid transparent`,
            borderLeft: `6px solid ${color}`,
          }
        : undefined,
    }}
  />
);

const Dot = () => (
  <Box
    component="span"
    sx={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      bgcolor: GRAPH.union,
      display: "inline-block",
      mr: 1,
      ml: "7px",
      verticalAlign: "middle",
    }}
  />
);

const GraphLegend = () => {
  const { t } = useTranslation();
  const items = [
    { swatch: <Card colors={GRAPH.male} />, label: t("legend.male", "Man") },
    {
      swatch: <Card colors={GRAPH.female} />,
      label: t("legend.female", "Woman"),
    },
    {
      swatch: <Card colors={GRAPH.unknown} dashed />,
      label: t("legend.deceased", "Deceased"),
    },
    { swatch: <Dot />, label: t("legend.union", "Couple / parents") },
    {
      swatch: <Line color={GRAPH.partnerEdge} />,
      label: t("legend.partner", "Partner"),
    },
    {
      swatch: <Line color={GRAPH.childEdge} arrow />,
      label: t("legend.child", "Child"),
    },
  ];
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", px: 1 }}>
      {items.map(({ swatch, label }) => (
        <Typography key={label} variant="body2" component="span">
          {swatch}
          {label}
        </Typography>
      ))}
    </Box>
  );
};

export default GraphLegend;
