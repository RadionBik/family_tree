import React, { useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import elk from "cytoscape-elk";
import ELK from "elkjs/lib/elk.bundled.js";
import $ from "jquery";
import qtip from "cytoscape-qtip";
import "qtip2/dist/jquery.qtip.min.css";

cytoscape.use(elk);
qtip(cytoscape, $);

const FamilyTreeGraph = ({ elements, onNodeClick, selectedNodeId }) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const isMounted = useRef(true);

  const stylesheet = useMemo(
    () => [
      {
        selector: "node",
        style: {
          "background-color": "#aaa",
          label: "data(label)",
          width: "label",
          height: "label",
          padding: "10px",
          shape: "round-rectangle",
          "text-valign": "center",
          "text-halign": "center",
          color: "#fff",
          "text-outline-width": 2,
          "text-outline-color": "#888",
          "font-size": "12px",
        },
      },
      {
        selector: 'node[gender="male"]',
        style: {
          "background-color": "#6CBEEB",
          shape: "rectangle",
        },
      },
      {
        selector: 'node[gender="female"]',
        style: {
          "background-color": "#F7A6C4",
          shape: "ellipse",
        },
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": "#ccc",
          "curve-style": "bezier",
          "font-size": "10px",
          color: "#555",
          "text-rotation": "autorotate",
          "text-margin-y": -10,
        },
      },
      {
        selector: 'edge[label="PARENT"]',
        style: {
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#28a745",
          "line-color": "#28a745",
          "line-style": "solid",
        },
      },
      {
        selector: 'edge[label="SPOUSE"]',
        style: {
          "line-style": "dashed",
          "target-arrow-shape": "none",
          "line-color": "#fd7e14",
        },
      },
      {
        selector: "node:selected",
        style: {
          "border-width": 3,
          "border-color": "#DAA520",
        },
      },
      {
        selector: "node.highlighted-node",
        style: {
          "border-width": 5,
          "border-color": "#ff0000",
          "border-opacity": 0.8,
          "shadow-blur": 10,
          "shadow-color": "#ff0000",
          "shadow-opacity": 0.6,
          "z-index": 999,
        },
      },
    ],
    [],
  );

  const layout = useMemo(
    () => ({
      name: "elk",
      fit: true,
      padding: 50,
      elk: {
        algorithm: "layered",
        "elk.direction": "DOWN",
        "elk.layered.spacing.nodeNodeBetweenLayers": "80",
        "elk.spacing.nodeNode": "40",
        "elk.layered.nodePlacement.favorStraightEdges": "true",
        "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
        "elk.separateConnectedComponents": "false",
        "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
        "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) {
      console.log("Container ref not ready");
      return;
    }

    console.log("Initializing Cytoscape directly...");

    if (cyRef.current) {
      console.log("Destroying previous Cytoscape instance.");
      cyRef.current.nodes().forEach((node) => {
        const qtipApi = node.scratch("_qtip");
        if (qtipApi) {
          qtipApi.destroy(true);
        }
      });
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: CytoscapeComponent.normalizeElements(elements || []),
      style: stylesheet,
      layout: { name: "preset" },
      minZoom: 0.5,
      maxZoom: 2,
    });

    cyRef.current = cy;

    const runLayoutAndTooltips = () => {
      console.log("Setting up qTips...");

      cy.nodes().forEach((node) => {
        const nodeData = node.data();
        if (typeof node.qtip !== "function") {
          console.error(
            `node.qtip is not a function for node ${node.id()}. Check registration.`,
          );
          return;
        }

        const placeholder = t("common.noData", "No data");

        let ageString = placeholder;
        if (nodeData.birth_date) {
          try {
            const birthDate = new Date(nodeData.birth_date);
            const endDate = nodeData.death_date
              ? new Date(nodeData.death_date)
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
                if (nodeData.death_date) {
                  ageString += ` ${t("ageAtDeathSuffix", "(at time of death)")}`;
                }
              } else {
                console.warn(`Calculated negative age for node ${nodeData.id}`);
                ageString = t("invalidDate", "Invalid date");
              }
            } else {
              console.warn(
                `Invalid birth date format for node ${nodeData.id}: ${nodeData.birth_date}`,
              );
              ageString = t("invalidDate", "Invalid date");
            }
          } catch (e) {
            console.error(`Error calculating age for node ${nodeData.id}:`, e);
            ageString = t("ageCalculationError", "Error");
          }
        }

        let tooltipLabel = nodeData.label || `ID: ${node.id()}`;
        let tooltipHTML = `<strong>${tooltipLabel}</strong>`;
        tooltipHTML += `<br/>${t("birthDate", "Born")}: ${nodeData.birth_date || placeholder}`;
        tooltipHTML += `<br/>${t("deathDate", "Died")}: ${nodeData.death_date || placeholder}`;
        tooltipHTML += `<br/>${t("genderLabel", "Gender")}: ${nodeData.gender ? t(`gender.${nodeData.gender.toLowerCase()}`, nodeData.gender) : placeholder}`;
        tooltipHTML += `<br/>${t("ageLabel", "Age")}: ${ageString}`;

        node.qtip({
          content: tooltipHTML,
          position: { my: "bottom center", at: "top center", target: node },
          style: { classes: "qtip-bootstrap", tip: { width: 16, height: 8 } },
          show: { event: "mouseover", solo: true },
          hide: { event: "mouseout unfocus", fixed: true, delay: 100 },
        });
      });
      console.log("qTips setup complete.");

      console.log("Running ELK layout...");
      const elkLayout = cy.layout(layout);

      elkLayout.one("layoutstop", () => {
        if (!isMounted.current) {
          console.log(
            "Layout stopped, but component unmounted. Skipping unlock.",
          );
          return;
        }
        console.log("Layout stopped, unlocking nodes...");
        cy.nodes().forEach((node) => {
          node.unlock();
        });
        console.log("Nodes unlock attempted after layout.");
      });

      elkLayout.run();
    };

    const timeoutId = setTimeout(runLayoutAndTooltips, 50);

    const handleNodeTap = (event) => {
      const tappedNode = event.target;
      const nodeData = tappedNode.data();
      console.log("Node tapped:", nodeData);

      cy.nodes().forEach((n) => {
        const qtipApi = n.scratch("_qtip");
        if (qtipApi) {
          qtipApi.hide();
        }
      });

      tappedNode.addClass("tapped-node");
      setTimeout(() => {
        tappedNode.removeClass("tapped-node");
      }, 300);

      if (onNodeClick) {
        onNodeClick(nodeData);
      }
    };
    cy.on("tap", "node", handleNodeTap);

    cy.style()
      .selector(".tapped-node")
      .style({
        "background-color": "#ffcc00",
        "transition-duration": "0.1s",
        "transition-property": "background-color",
      })
      .update();

    return () => {
      console.log("Cleaning up Cytoscape instance and listeners...");
      isMounted.current = false;
      clearTimeout(timeoutId);
      if (cyRef.current) {
        cyRef.current.off("tap", "node", handleNodeTap);
        cyRef.current.nodes().forEach((node) => {
          const qtipApi = node.scratch("_qtip");
          if (qtipApi) {
            qtipApi.destroy(true);
          }
        });
        cyRef.current.destroy();
        cyRef.current = null;
        console.log("Cytoscape instance destroyed.");
      }
    };
  }, [elements, onNodeClick, layout, stylesheet]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("highlighted-node");

    if (selectedNodeId) {
      const selectedNode = cy.getElementById(String(selectedNodeId));
      if (selectedNode.length > 0) {
        selectedNode.addClass("highlighted-node");
        console.log(`Highlighting node: ${selectedNodeId}`);
      } else {
        console.log(
          `Node with ID ${selectedNodeId} not found for highlighting.`,
        );
      }
    }
  }, [selectedNodeId]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "600px", border: "1px solid #ddd" }}
    />
  );
};

export default FamilyTreeGraph;
