import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FamilyTreeGraph from './FamilyTreeGraph'; // Import the graph component
import GraphLegend from './GraphLegend'; // Import the legend component
import familyTreeService from '../services/familyTreeService'; // Import the service

// Helper function to transform API data to Cytoscape format
const transformDataForCytoscape = (members) => {
  const elements = [];
  const edgeIds = new Set(); // To avoid duplicate edges

  members.forEach(member => {
    // Add node for the family member
    elements.push({
      data: {
        id: String(member.id), // Cytoscape IDs should be strings
        label: member.name,
        gender: member.gender,
        birth_date: member.birth_date,
        death_date: member.death_date,
        notes: member.notes,
        // Add other relevant data here
      }
    });

    // Add edges based on relationships_from (avoids duplicates)
    member.relationships_from.forEach(relation => {
      const edgeId = `rel-${relation.id}`;
      if (!edgeIds.has(edgeId)) {
        elements.push({
          data: {
            id: edgeId,
            source: String(relation.from_member_id),
            target: String(relation.to_member_id),
            label: relation.relation_type // Optional: label edges
            // Add other relation data if needed
          }
        });
        edgeIds.add(edgeId);
      }
    });
  });

  return elements;
};


const FamilyTree = () => {
  const { t } = useTranslation();
  const [elements, setElements] = useState([]); // State for graph elements
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error handling
  const [selectedMember, setSelectedMember] = useState(null); // State for selected node data

  // Handler for node clicks from the graph component
  const handleNodeClick = (nodeData) => {
    console.log("Node clicked in parent:", nodeData);
    setSelectedMember(nodeData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const familyData = await familyTreeService.getFamilyTreeData(); // Fetch data
        console.log("Fetched family data:", familyData); // Log fetched data
        if (Array.isArray(familyData)) {
            const transformedElements = transformDataForCytoscape(familyData);
            console.log("Transformed elements:", transformedElements); // Log transformed data
            setElements(transformedElements);
        } else {
            console.error("Fetched data is not an array:", familyData);
            setError(t('familyTree.errorInvalidData'));
            setElements([]); // Ensure elements is an empty array on error
        }
      } catch (err) {
        console.error("Error fetching or transforming family tree data:", err);
        setError(t('familyTree.errorLoading'));
        setElements([]); // Ensure elements is an empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]); // Add t to dependencies as it's used in error messages

  return (
    <section className="family-tree">
      <h2>{t('familyTree.title')}</h2>
      {loading && <p>{t('loading')}...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && elements.length > 0 && (
        <FamilyTreeGraph elements={elements} onNodeClick={handleNodeClick} /> // Pass handler
      )}
      {!loading && !error && elements.length === 0 && (
          <p>{t('familyTree.noData')}</p> // Show message if no data after loading
      )}

      {/* Render Legend if graph is displayed */}
      {/* {!loading && !error && elements.length > 0 && <GraphLegend />} */} {/* Removed Legend */}

      {/* Display selected member details */}
      {selectedMember && (
        <div className="member-details" style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee' }}>
          <h3>{t('familyTree.detailsTitle')}</h3>
          <p><strong>{t('name')}:</strong> {selectedMember.label}</p>
          {selectedMember.birth_date && <p><strong>{t('birthDate')}:</strong> {selectedMember.birth_date}</p>}
          {selectedMember.death_date && <p><strong>{t('deathDate')}:</strong> {selectedMember.death_date}</p>}
          {selectedMember.gender && <p><strong>{t('genderLabel')}:</strong> {t(`gender.${selectedMember.gender}`, selectedMember.gender)}</p>}
          {selectedMember.notes && <p><strong>{t('notes')}:</strong> {selectedMember.notes}</p>}
          {/* Add more details as needed */}
          <button onClick={() => setSelectedMember(null)} style={{ marginTop: '10px' }}>
            {t('close')}
          </button>
        </div>
      )}
    </section>
  );
};

export default FamilyTree;