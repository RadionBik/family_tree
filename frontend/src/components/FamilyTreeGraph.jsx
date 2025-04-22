import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape'; // Import cytoscape core
import elk from 'cytoscape-elk'; // Import elk layout extension
import ELK from 'elkjs/lib/elk.bundled.js'; // Import elkjs

cytoscape.use(elk); // Register the elk layout

const FamilyTreeGraph = ({ elements, onNodeClick }) => { // Add onNodeClick prop
  const cyRef = useRef(null);

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
        'label': 'data(label)', // Display the edge label
        'font-size': '10px', // Smaller font for edge labels
        'color': '#555', // Label color
        'text-rotation': 'autorotate',
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

  // Layout options using elk
  const layout = {
    name: 'elk',
    fit: true,
    padding: 50,
    // ELK options: Use layered algorithm for hierarchy
    elk: {
      algorithm: 'layered',
      'elk.direction': 'DOWN', // Top to bottom
      'elk.layered.spacing.nodeNodeBetweenLayers': '80', // Vertical spacing
      'elk.spacing.nodeNode': '40', // Horizontal spacing within layer
      // Attempt to influence node order within layers using is_descendant
      // This tells ELK how to order nodes that are otherwise equivalent in the hierarchy.
      // We want non-descendants (false) to come before descendants (true)
      'elk.layered.nodePlacement.favorStraightEdges': 'true',
      'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
      'elk.separateConnectedComponents': 'false',
      // Use Network Simplex node placement strategy
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      // Set alignment for Network Simplex
      'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED', // Options: LEFTUP, RIGHTDOWN, BALANCED, CENTER
      // Removed semiInteractive crossing minimization
    },
  };


  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) {
      return; // Cytoscape instance not ready yet
    }

    console.log('Cytoscape instance available, attaching listeners:', cy);

    // Click/Tap listener for nodes
    const handleNodeTap = (event) => {
      const nodeData = event.target.data();
      console.log('Node tapped:', nodeData);
      if (onNodeClick) {
        onNodeClick(nodeData); // Call the callback prop
      }
    };

    cy.on('tap', 'node', handleNodeTap);

    // Cleanup listener on component unmount or when onNodeClick changes
    return () => {
      console.log('Cleaning up Cytoscape listeners');
      cy.off('tap', 'node', handleNodeTap);
      // cy.destroy(); // Optional: destroy instance on unmount
    };
  }, [onNodeClick]); // Add onNodeClick to dependency array

  return (
    <CytoscapeComponent
      elements={CytoscapeComponent.normalizeElements(elements || [])} // Use provided elements or empty array
      style={{ width: '100%', height: '600px', border: '1px solid #ddd' }}
      layout={layout}
      stylesheet={stylesheet}
      cy={(cy) => { cyRef.current = cy; }} // Assign the cy instance to the ref
      minZoom={0.5}
      maxZoom={2}
    />
  );
};

export default FamilyTreeGraph;