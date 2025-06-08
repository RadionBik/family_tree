import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import cytoscape from "cytoscape";
import elk from "cytoscape-elk";
import $ from "jquery";
import qtip from "cytoscape-qtip";
import "qtip2/dist/jquery.qtip.min.css";
import { GRAPH } from "../graphTheme";
import { ageOn } from "../utils/age";

cytoscape.use(elk);
qtip(cytoscape, $);

const STYLESHEET = [
  {
    selector: "node",
    style: {
      shape: "round-rectangle",
      width: "label",
      height: "label",
      padding: "8px",
      "background-color": GRAPH.unknown.bg,
      "border-width": 2,
      "border-color": GRAPH.unknown.border,
      label: "data(display)",
      "text-wrap": "wrap",
      "text-max-width": "160px",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": "11px",
      "line-height": 1.25,
      color: GRAPH.text,
    },
  },
  {
    selector: 'node[gender="MALE"]',
    style: {
      "background-color": GRAPH.male.bg,
      "border-color": GRAPH.male.border,
    },
  },
  {
    selector: 'node[gender="FEMALE"]',
    style: {
      "background-color": GRAPH.female.bg,
      "border-color": GRAPH.female.border,
    },
  },
  {
    selector: "node[?deceased]",
    style: {
      "background-color": GRAPH.deceasedBg,
      "border-style": "dashed",
      color: GRAPH.mutedText,
    },
  },
  // Union = a couple or a parent set; the point children hang from.
  {
    selector: "node[?union]",
    style: {
      shape: "ellipse",
      width: 8,
      height: 8,
      padding: 0,
      label: "",
      "background-color": GRAPH.union,
      "border-width": 0,
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.5,
      "curve-style": "taxi",
      "taxi-direction": "downward",
      "line-color": GRAPH.childEdge,
      "target-arrow-shape": "none",
    },
  },
  {
    selector: 'edge[kind="partner"]',
    style: { "line-color": GRAPH.partnerEdge, width: 2 },
  },
  {
    selector: 'edge[kind="child"]',
    style: {
      "target-arrow-shape": "triangle",
      "target-arrow-color": GRAPH.childEdge,
      "arrow-scale": 0.8,
    },
  },
  {
    selector: "node.focus",
    style: { "border-width": 4, "border-color": GRAPH.focus, "z-index": 10 },
  },
  { selector: ".dim", style: { opacity: 0.15 } },
];

const LAYOUT = {
  name: "elk",
  fit: true,
  padding: 30,
  elk: {
    algorithm: "layered",
    "elk.direction": "DOWN",
    "elk.layered.spacing.nodeNodeBetweenLayers": "45",
    "elk.spacing.nodeNode": "25",
    "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
  },
};

const FamilyTreeGraph = ({ elements, onNodeClick, selectedNodeId }) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  // Read through a ref so a new callback identity does not rebuild the graph.
  const onNodeClickRef = useRef(onNodeClick);
  onNodeClickRef.current = onNodeClick;

  useEffect(() => {
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: STYLESHEET,
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });
    cyRef.current = cy;

    const placeholder = t("common.noData", "No data");
    cy.nodes("[!union]").forEach((node) => {
      const d = node.data();
      const age = ageOn(d.birth_date, d.death_date);
      const rows = [
        `<strong>${d.label}</strong>`,
        `${t("birthDate", "Born")}: ${d.birth_date || placeholder}`,
        d.death_date ? `${t("deathDate", "Died")}: ${d.death_date}` : null,
        age !== null
          ? `${t("ageLabel", "Age")}: ${t("years", "{{count}} years", { count: age })}${
              d.death_date
                ? ` ${t("ageAtDeathSuffix", "(at time of death)")}`
                : ""
            }`
          : null,
        d.location ? `${t("locationLabel", "Location")}: ${d.location}` : null,
      ].filter(Boolean);
      node.qtip({
        content: rows.join("<br/>"),
        position: { my: "bottom center", at: "top center", target: node },
        style: { classes: "qtip-bootstrap", tip: { width: 16, height: 8 } },
        show: { event: "mouseover", solo: true },
        hide: { event: "mouseout unfocus", fixed: true, delay: 100 },
      });
    });

    cy.on("tap", "node[!union]", (e) =>
      onNodeClickRef.current?.(e.target.data()),
    );
    cy.on("tap", (e) => {
      if (e.target === cy) onNodeClickRef.current?.(null);
    });
    cy.layout(LAYOUT).run();

    return () => {
      cy.nodes().forEach((n) => n.scratch("_qtip")?.destroy(true));
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, t]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("dim focus");
    if (!selectedNodeId) return;
    const node = cy.getElementById(String(selectedNodeId));
    if (node.empty()) return;
    // Keep the person, their unions, and everyone attached to those unions.
    const near = node.closedNeighborhood();
    const keep = near.union(near.nodes("[?union]").closedNeighborhood());
    node.addClass("focus");
    cy.elements().not(keep).addClass("dim");
    cy.animate({ center: { eles: node }, duration: 300 });
  }, [selectedNodeId]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default FamilyTreeGraph;
