import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape'; // Import cytoscape core
import dagre from 'cytoscape-dagre'; // Import dagre layout extension

cytoscape.use(dagre); // Register the dagre layout

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
        'line-color': '#ccc',
        'curve-style': 'bezier', // Smoother curves
        // 'target-arrow-shape': 'triangle', // Keep arrows for parent-child? Maybe remove for spouse?
        // 'target-arrow-color': '#ccc',
      }
    },
    {
        selector: 'edge[label="parent-child"]', // Style for parent-child edges
        style: {
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#ccc',
            'line-style': 'solid'
        }
    },
    {
        selector: 'edge[label="spouse"]', // Style for spouse edges
        style: {
            'line-style': 'dashed', // Dashed line for spouse relationship
            'target-arrow-shape': 'none' // No arrow for spouse relationship
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

  // Layout options using dagre
  const layout = {
    name: 'dagre',
    rankDir: 'TB', // Top to bottom ranking
    fit: true,
    padding: 50, // Increased padding
    spacingFactor: 1.2, // Adjust spacing between nodes
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: true,
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