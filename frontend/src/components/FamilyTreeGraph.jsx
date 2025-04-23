import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs'; // Keep for normalizeElements
import cytoscape from 'cytoscape';
import elk from 'cytoscape-elk'; // Keep elk registered
import ELK from 'elkjs/lib/elk.bundled.js';
// import dagre from 'cytoscape-dagre'; // Remove dagre import
import $ from 'jquery';
import qtip from 'cytoscape-qtip';
import 'qtip2/dist/jquery.qtip.min.css';

// Register extensions globally
cytoscape.use(elk);
// cytoscape.use(dagre); // Remove dagre registration
qtip(cytoscape, $);


const FamilyTreeGraph = ({ elements, onNodeClick }) => {
  const containerRef = useRef(null); // Ref for the container div
  const cyRef = useRef(null); // Ref to store the cy instance

  // Enhanced stylesheet
  const stylesheet = [
    {
      selector: 'node', // Default node style
      style: {
        'background-color': '#aaa', // Neutral default color
        'label': 'data(label)',
        'width': 'label', // Adjust width based on label
        'height': 'label', // Adjust height based on label
        'padding': '10px',
        'shape': 'round-rectangle', // Default shape
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#fff', // Label color
        'text-outline-width': 2,
        'text-outline-color': '#888', // Outline for better readability
        'font-size': '12px'
      }
    },
    {
      selector: 'node[gender="male"]', // Style for male nodes
      style: {
        'background-color': '#6CBEEB', // Blueish color
        'shape': 'rectangle' // Different shape
      }
    },
    {
      selector: 'node[gender="female"]', // Style for female nodes
      style: {
        'background-color': '#F7A6C4', // Pinkish color
        'shape': 'ellipse' // Different shape
      }
    },
    {
      selector: 'edge', // Default edge style
      style: {
        'width': 2,
        'line-color': '#ccc', // Default color
        'curve-style': 'bezier', // Smoother curves
        // 'label': 'data(label)', // Removed: Display the edge label
        'font-size': '10px', // Smaller font for edge labels (kept for potential future use, but label removed)
        'color': '#555', // Label color (kept for potential future use)
        'text-rotation': 'autorotate', // Kept for potential future use
        'text-margin-y': -10, // Adjust label position relative to edge
      }
    },
    {
        selector: 'edge[label="PARENT"]', // Exact match for "PARENT"
        style: {
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#28a745', // Green arrow
            'line-color': '#28a745', // Green line
            'line-style': 'solid'
        }
    },
    {
        selector: 'edge[label="SPOUSE"]', // Exact match for "SPOUSE"
        style: {
            'line-style': 'dashed', // Dashed line for spouse relationship
            'target-arrow-shape': 'none', // No arrow for spouse relationship
            'line-color': '#fd7e14' // Orange line
        }
    },
    {
      selector: 'node:selected', // Style for selected node
      style: {
        'border-width': 3,
        'border-color': '#DAA520' // Gold border for selected
      }
    }
  ];

  // Layout options using elk (Restored detailed options)
  const layout = {
    name: 'elk',
    fit: true, // Keep fit option
    padding: 50,
    // Restore detailed ELK options
    elk: {
      algorithm: 'layered',
      'elk.direction': 'DOWN', // Top to bottom
      'elk.layered.spacing.nodeNodeBetweenLayers': '80', // Vertical spacing
      'elk.spacing.nodeNode': '40', // Horizontal spacing within layer
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
      'elk.separateConnectedComponents': 'false',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED', // Options: LEFTUP, RIGHTDOWN, BALANCED, CENTER
    },
  };


  // Effect to initialize and manage the Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) {
      console.log("Container ref not ready");
      return;
    }

    console.log("Initializing Cytoscape directly...");

    // Destroy previous instance if it exists
    if (cyRef.current) {
        console.log("Destroying previous Cytoscape instance.");
        // Destroy qtips before destroying the instance
        cyRef.current.nodes().forEach(node => {
            const qtipApi = node.scratch('_qtip'); // qtip stores API in scratchpad
            if (qtipApi) {
                qtipApi.destroy(true); // Destroy qtip instance immediately
            }
        });
        cyRef.current.destroy();
        cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: CytoscapeComponent.normalizeElements(elements || []),
      style: stylesheet,
      layout: { name: 'preset' },
      minZoom: 0.5,
      maxZoom: 2,
      // Remove explicit interaction settings to rely on defaults
      // userPanningEnabled: true,
      // userZoomingEnabled: true,
      // boxSelectionEnabled: true,
    });

    cyRef.current = cy;

    // Define the function to run layout and setup qTips
    const runLayoutAndTooltips = () => {
        console.log("Running ELK layout...");
        const elkLayout = cy.layout(layout); // Use ELK layout config

        // Use the 'stop' event of the layout to set up tooltips *and* unlock nodes
        elkLayout.one('layoutstop', () => {
            console.log("Layout stopped, setting up qTips and unlocking nodes...");

            // Setup qTips first
            cy.nodes().forEach((node) => {
                const nodeData = node.data();
                // console.log(`Processing node: ${nodeData.label} (ID: ${node.id()}), typeof node.qtip: ${typeof node.qtip}`); // Keep log removed

                if (typeof node.qtip !== 'function') {
                    console.error(`node.qtip is not a function for node ${node.id()}. Check registration.`);
                    return;
                }

                // Ensure tooltip shows something, even if just ID
                let tooltipLabel = nodeData.label || `ID: ${node.id()}`;
                let tooltipHTML = `<strong>${tooltipLabel}</strong>`;
                if (nodeData.birth_date) tooltipHTML += `<br/>Born: ${nodeData.birth_date}`;
                if (nodeData.death_date) tooltipHTML += `<br/>Died: ${nodeData.death_date}`;
                if (nodeData.gender) tooltipHTML += `<br/>Gender: ${nodeData.gender}`;

                node.qtip({
                    content: tooltipHTML,
                    position: { my: 'bottom center', at: 'top center', target: node },
                    style: { classes: 'qtip-bootstrap', tip: { width: 16, height: 8 } },
                    show: {
                        event: 'mouseover',
                        solo: true, // Hide other tooltips when this one shows
                    },
                    hide: {
                        event: 'mouseout unfocus', // Hide on mouseout or when focus is lost
                        fixed: true, // Allows hovering over the tooltip itself without hiding
                        delay: 100 // Small delay before hiding
                    }
                });
            }); // End qTip setup loop

            // Unlock nodes after setting up tooltips by iterating
            console.log("Attempting to unlock nodes individually...");
            cy.nodes().forEach(node => {
                node.unlock();
            });
            console.log("Nodes unlock attempted after layout.");
        }); // End layoutstop listener

        elkLayout.run(); // Start the layout run
    };

    // Run layout/tooltips after a short delay (keep delay for ELK)
    const timeoutId = setTimeout(runLayoutAndTooltips, 50);

    // Setup tap listener immediately
    const handleNodeTap = (event) => {
        const tappedNode = event.target;
        const nodeData = tappedNode.data();
        console.log('Node tapped:', nodeData);

        // Hide all existing qTips immediately on tap
        cy.nodes().forEach(n => {
            const qtipApi = n.scratch('_qtip');
            if (qtipApi) {
                qtipApi.hide();
            }
        });

        // Add a brief visual flash on tap
        tappedNode.addClass('tapped-node');
        setTimeout(() => {
            tappedNode.removeClass('tapped-node');
        }, 300); // Remove class after 300ms

        if (onNodeClick) {
            onNodeClick(nodeData);
        }
    };
    cy.on('tap', 'node', handleNodeTap);

    // Add a style for the tapped node flash
    cy.style().selector('.tapped-node').style({
        'background-color': '#ffcc00', // Bright yellow flash
        'transition-duration': '0.1s',
        'transition-property': 'background-color'
    }).update();


    // Cleanup function for the main effect
    return () => {
      console.log("Cleaning up Cytoscape instance and listeners...");
      clearTimeout(timeoutId); // Clear the timeout for ELK delay
      if (cyRef.current) {
        // Destroy qtips
        cyRef.current.nodes().forEach(node => {
            const qtipApi = node.scratch('_qtip');
            if (qtipApi) {
                qtipApi.destroy(true);
            }
        });
        // Unbind tap listener
        cyRef.current.off('tap', 'node', handleNodeTap);
        // Destroy instance
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  // This main effect depends on elements and the onNodeClick callback
  }, [elements, onNodeClick]);

  // Remove the duplicate/separate tap listener effect entirely

  // Render the container div
  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
    />
  );
};

// Removed import from here as it's moved to the top

export default FamilyTreeGraph;