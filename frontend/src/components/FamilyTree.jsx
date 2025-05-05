import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FamilyTreeGraph from './FamilyTreeGraph'; // Import the graph component
import GraphLegend from './GraphLegend'; // Import the legend component
import familyTreeService from '../services/familyTreeService'; // Import the service

// Helper function to transform API data to Cytoscape format
const transformDataForCytoscape = (members) => {
  // console.log("[transformData] Input members:", members); // Remove log
  const elements = [];
  const edgeIds = new Set();
  const memberMap = new Map(members.map(m => [String(m.id), m]));

  // 1. Create node elements
  members.forEach(member => {
    elements.push({
      data: {
        id: String(member.id),
        label: member.name,
        gender: member.gender,
        birth_date: member.birth_date,
        death_date: member.death_date,
        notes: member.notes,
        is_descendant: member.is_descendant, // Include the flag
      }
    });
  });

  // 2. Create edge elements, filtering ALL outgoing edges from non-descendants
  members.forEach(member => {
    // Iterate through relationships where the current 'member' is the source
    member.relationships_from.forEach(relation => {
      const edgeId = `rel-${relation.id}`;
      const sourceId = String(relation.from_member_id); // This is member.id
      const targetId = String(relation.to_member_id);
      const sourceMember = memberMap.get(sourceId); // Get source member info

      // PRIMARY FILTER: Only process edges originating from descendants
      if (sourceMember && sourceMember.is_descendant === true) {
        // Secondary Filter: Filter out duplicates and 'child' relationships (implied by 'parent')
        // Use direct string comparison assuming backend sends strings
        if (!edgeIds.has(edgeId) && relation.relation_type !== 'CHILD') {
          // Add the edge (any type originating from a descendant)
          elements.push({ data: { id: edgeId, source: sourceId, target: targetId, label: relation.relation_type } });
          edgeIds.add(edgeId);
        }
      } else {
        // Optionally log skipped edges from non-descendants
        // console.log(`[EDGE SKIP] Skipping edge ${edgeId} (${relation.relation_type}) from non-descendant ${sourceId}`);
      }
    });
  });

  // Removed edge sorting logic

  // console.log("[transformData] Output elements:", elements); // Remove log
  // Remove specific checks
  // const peterNode = elements.find(el => el.data.label === 'Peter Doe');
  // const johnNode = elements.find(el => el.data.label === 'John Doe');
  // console.log(`[transformData] Peter Doe node found in output: ${!!peterNode}`);
  // console.log(`[transformData] John Doe node found in output: ${!!johnNode}`);

  return elements;
};


// Accept selectedMemberId and onMemberSelect from HomePage
const FamilyTree = ({ selectedMemberId, onMemberSelect }) => {
  // console.log("--- FamilyTree Component Rendering ---"); // Remove log
  const { t } = useTranslation();
  const [elements, setElements] = useState([]); // State for graph elements
  const [loading, setLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error handling
  // Removed internal selectedMember state, now managed by HomePage

  // Handler for node clicks from the graph component - uses prop from HomePage
  const handleNodeClick = (nodeData) => {
    console.log("Node clicked in FamilyTree, calling onMemberSelect:", nodeData);
    // If the clicked node is already selected, deselect it, otherwise select it
    if (onMemberSelect) {
        onMemberSelect(selectedMemberId === nodeData?.id ? null : nodeData?.id);
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to track mount status

    // console.log("--- FamilyTree useEffect Running ---"); // Remove log
    const fetchData = async () => {
      // Start loading only if mounted
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      try {
        const familyData = await familyTreeService.getFamilyTreeData(); // Fetch data
        console.log("Fetched family data:", familyData); // Log fetched data

        // Process data only if mounted
        if (isMounted) {
          if (Array.isArray(familyData)) {
              // Remove specific checks
              // const peterFetched = familyData.find(m => m.name === 'Peter Doe');
              // const johnFetched = familyData.find(m => m.name === 'John Doe');
              // console.log(`[fetchData] Peter Doe found in fetched data: ${!!peterFetched}`);
              // console.log(`[fetchData] John Doe found in fetched data: ${!!johnFetched}`);

              const transformedElements = transformDataForCytoscape(familyData);
              // console.log("Transformed elements:", transformedElements);
              setElements(transformedElements);
          } else {
              console.error("Fetched data is not an array:", familyData);
              setError(t('familyTree.errorInvalidData'));
              setElements([]); // Ensure elements is an empty array on error
          }
        }
      } catch (err) {
        console.error("Error fetching or transforming family tree data:", err);
        // Set error only if mounted
        if (isMounted) {
          setError(t('familyTree.errorLoading'));
          setElements([]); // Ensure elements is an empty array on error
        }
      } finally {
        // Stop loading only if mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();

    // Cleanup function
    return () => {
      isMounted = false; // Set flag to false when component unmounts
      // console.log("--- FamilyTree Component Unmounting ---"); // Optional: log unmount
    };
  }, [t]); // Add t to dependencies as it's used in error messages

  return (
    <section className="family-tree">
      <h2>{t('familyTree.title')}</h2>
      {loading && <p>{t('loading')}...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && elements.length > 0 && (
        <FamilyTreeGraph
          elements={elements}
          onNodeClick={handleNodeClick} // Pass the updated handler
          selectedNodeId={selectedMemberId} // Pass the ID from props
        />
      )}
      {!loading && !error && elements.length === 0 && (
          <p>{t('familyTree.noData')}</p> // Show message if no data after loading
      )}

      {/* Render Legend if graph is displayed */}
      {!loading && !error && elements.length > 0 && <GraphLegend />} {/* Render Legend */}

      {/* Display selected member details based on selectedMemberId prop */}
      {selectedMemberId && (() => {
        // Find the selected member's data from the elements array
        // Ensure comparison uses strings for both IDs
        const memberElement = elements.find(el => el.data.id === String(selectedMemberId));
        const memberData = memberElement?.data;

        if (!memberData) {
            console.warn(`Member data not found in elements for ID: ${selectedMemberId}`); // Add warning
            return null; // Don't render if data not found
        }

        return (
          <div className="member-details" style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee' }}>
            <h3>{t('familyTree.detailsTitle')}</h3>
            <p><strong>{t('name')}:</strong> {memberData.label}</p>
            {memberData.birth_date && <p><strong>{t('birthDate')}:</strong> {memberData.birth_date}</p>}
            {memberData.death_date && <p><strong>{t('deathDate')}:</strong> {memberData.death_date}</p>}
            {memberData.gender && <p><strong>{t('genderLabel')}:</strong> {t(`gender.${memberData.gender}`, memberData.gender)}</p>}
            {memberData.notes && <p><strong>{t('notes')}:</strong> {memberData.notes}</p>}
            {/* Add more details as needed */}
            {/* Close button now calls onMemberSelect with null */}
            <button onClick={() => onMemberSelect(null)} style={{ marginTop: '10px' }}>
              {t('close')}
            </button>
          </div>
        );
      })()}
    </section>
  );
};

export default FamilyTree;