import React from "react";
import { useTranslation } from "react-i18next";

const LegendItem = ({ color, shape, label }) => {
  const shapeStyle = {
    width: "20px",
    height: "20px",
    backgroundColor: color,
    display: "inline-block",
    marginRight: "8px",
    verticalAlign: "middle",
    borderRadius:
      shape === "ellipse" ? "50%" : shape === "rectangle" ? "0" : "4px",
  };
  return (
    <div style={{ marginBottom: "5px" }}>
      <span style={shapeStyle}></span>
      <span>{label}</span>
    </div>
  );
};

const EdgeLegendItem = ({ lineStyle, arrow, color = "#ccc", label }) => {
  const lineExampleStyle = {
    width: "30px",
    height: "2px",
    borderTop: `2px ${lineStyle} ${color}`,
    display: "inline-block",
    marginRight: "8px",
    verticalAlign: "middle",
    position: "relative",
  };
  const arrowStyle = {
    content: '""',
    position: "absolute",
    right: "-4px",
    top: "-5px",
    border: `solid ${color}`,
    borderWidth: "0 2px 2px 0",
    display: "inline-block",
    padding: "3px",
    transform: "rotate(-45deg)",
  };
  return (
    <div style={{ marginBottom: "5px" }}>
      <span style={lineExampleStyle}>
        {arrow && <span style={arrowStyle}></span>}
      </span>
      <span>{label}</span>
    </div>
  );
};

const GraphLegend = () => {
  const { t } = useTranslation();

  return (
    <div
      className="graph-legend"
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid #eee",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h4>{t("familyTree.edgeLegendTitle", "Edge Types")}</h4>{" "}
      <EdgeLegendItem
        lineStyle="solid"
        arrow={true}
        color="#28a745"
        label={t("relationType.parent-child", "Parent-Child")}
      />
      <EdgeLegendItem
        lineStyle="dashed"
        arrow={false}
        color="#fd7e14"
        label={t("relationType.spouse", "Spouse")}
      />
    </div>
  );
};

export default GraphLegend;
