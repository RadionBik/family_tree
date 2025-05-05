import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import familyTreeService from '../services/familyTreeService'; // For API calls

// Simple component to display a single relationship and allow deletion
const RelationshipItem = ({ relation, currentMemberId, onDelete, members }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine the related member and the direction/type description
  let relatedMemberId = null;
  let relationDescriptionKey = '';
  let relationDescriptionContext = {};

  if (relation.from_member_id === currentMemberId) {
    relatedMemberId = relation.to_member_id;
    // Relation is FROM current member TO related member
    if (relation.relation_type === 'parent') relationDescriptionKey = 'relationDesc.isParentOf';
    else if (relation.relation_type === 'spouse') relationDescriptionKey = 'relationDesc.isSpouseOf';
    else relationDescriptionKey = 'relationDesc.isRelatedTo'; // Fallback
  } else {
    relatedMemberId = relation.from_member_id;
    // Relation is TO current member FROM related member
    if (relation.relation_type === 'parent') relationDescriptionKey = 'relationDesc.isChildOf';
    else if (relation.relation_type === 'spouse') relationDescriptionKey = 'relationDesc.isSpouseOf'; // Spouse is symmetric
    else relationDescriptionKey = 'relationDesc.isRelatedTo'; // Fallback
  }

  const relatedMember = members.find(m => m.id === relatedMemberId);
  const relatedMemberName = relatedMember ? relatedMember.name : t('common.unknown', 'Unknown');
  relationDescriptionContext = { name: relatedMemberName };

  const handleDelete = async () => {
    // Add confirmation dialog
    const confirmMessage = t('relationshipManager.confirmDeleteRelation', 'Are you sure you want to delete this relationship?', {
        type: t(`relationType.${relation.relation_type}`, relation.relation_type), // Localize type if possible
        name: relatedMemberName
    });
    if (window.confirm(confirmMessage)) {
        setIsDeleting(true);
        try {
            await familyTreeService.deleteRelationshipAdmin(relation.id);
            onDelete(relation.id, 'success'); // Notify parent of success
        } catch (error) {
      console.error(`Error deleting relationship ${relation.id}:`, error);
      onDelete(relation.id, 'error', error.response?.data?.detail || t('relationshipManager.errorDelete', 'Failed to delete relationship.')); // Notify parent of error
      setIsDeleting(false); // Only stop loading on error
    }
  } // <-- Add missing closing brace for the if statement
    // Don't setIsDeleting(false) on success, as the item will be removed
  };

  return (
    <li>
      {t(relationDescriptionKey, relationDescriptionContext)}
      <button onClick={handleDelete} disabled={isDeleting} className="delete-button-small">
        {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
      </button>
    </li>
  );
};


// Main component to manage relationships for a member
const RelationshipManager = ({ memberId, relationshipsFrom, relationshipsTo, onRelationshipChange }) => {
  const { t } = useTranslation();
  const [allMembers, setAllMembers] = useState([]); // For the dropdown
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' }); // For create/delete status

  // Form state for adding new relationship
  const [relatedMemberId, setRelatedMemberId] = useState('');
  const [relationType, setRelationType] = useState('parent'); // Default type
  const [isCreating, setIsCreating] = useState(false);

  // Combine relationships for display
  const allRelations = [...relationshipsFrom, ...relationshipsTo];

  // Fetch all members for the dropdown selector
  useEffect(() => {
    setLoadingMembers(true);
    familyTreeService.getMembersAdmin() // Use admin fetch to get all members
      .then(data => {
        // Filter out the current member from the list of potential relatives
        setAllMembers(data.filter(m => m.id !== memberId));
      })
      .catch(err => {
        console.error("Error fetching members for relationship manager:", err);
        setError(t('relationshipManager.errorFetchMembers', 'Failed to load members list.'));
      })
      .finally(() => setLoadingMembers(false));
  }, [memberId, t]);

  const handleCreateRelationship = async (e) => {
    e.preventDefault();
    if (!relatedMemberId) {
        setMessage({ type: 'error', text: t('relationshipManager.errorSelectMember', 'Please select a member to relate.') });
        return;
    }
    setIsCreating(true);
    setMessage({ type: '', text: '' });

    try {
      // Determine correct from/to based on relation type (e.g., parent means current member is parent OF related member)
      let fromId = memberId;
      let toId = parseInt(relatedMemberId, 10);
      let type = relationType;

      // Adjust for child relationship (means related member is parent OF current member)
      if (relationType === 'child') {
          fromId = parseInt(relatedMemberId, 10);
          toId = memberId;
          type = 'parent'; // Store as parent relationship in DB
      }

      await familyTreeService.createRelationshipAdmin(fromId, toId, type);
      setMessage({ type: 'success', text: t('relationshipManager.createSuccess', 'Relationship added successfully.') });
      setRelatedMemberId(''); // Reset form
      setRelationType('parent');
      onRelationshipChange('create', 'success'); // Notify parent page to potentially re-fetch data
    } catch (error) {
      console.error("Error creating relationship:", error);
      setMessage({ type: 'error', text: error.response?.data?.detail || t('relationshipManager.errorCreate', 'Failed to add relationship.') });
    } finally {
      setIsCreating(false);
    }
  };

  // Callback for when a RelationshipItem is deleted
  const handleRelationDeleted = (relationId, status, errorText = '') => {
      if (status === 'success') {
          setMessage({ type: 'success', text: t('relationshipManager.deleteSuccess', 'Relationship deleted successfully.') });
          onRelationshipChange('delete', 'success'); // Notify parent
      } else {
          setMessage({ type: 'error', text: errorText });
      }
  };


  return (
    <div className="relationship-manager">
      <h4>{t('relationshipManager.title', 'Manage Relationships')}</h4>

      {error && <div className="message message-error">{error}</div>}
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      {/* List Existing Relationships */}
      <div className="existing-relationships">
        <h5>{t('relationshipManager.existingTitle', 'Existing Relationships:')}</h5>
        {allRelations.length > 0 ? (
          <ul>
            {allRelations.map(rel => (
              <RelationshipItem
                key={rel.id}
                relation={rel}
                currentMemberId={memberId}
                onDelete={handleRelationDeleted}
                members={allMembers} // Pass member list for name lookup
              />
            ))}
          </ul>
        ) : (
          <p>{t('relationshipManager.noExisting', 'No relationships defined yet.')}</p>
        )}
      </div>

      {/* Add New Relationship Form */}
      <div className="add-relationship-form">
        <h5>{t('relationshipManager.addTitle', 'Add New Relationship')}</h5>
        <form onSubmit={handleCreateRelationship}>
          <div className="form-group">
            <label htmlFor="relationType">{t('relationshipManager.relationTypeLabel', 'Relationship Type:')}</label>
            <select
              id="relationType"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              disabled={isCreating || loadingMembers}
            >
              {/* Add 'child' as an option for easier user understanding */}
              <option value="parent">{t('relationType.parent', 'Parent of')}</option>
              <option value="child">{t('relationType.child', 'Child of')}</option>
              <option value="spouse">{t('relationType.spouse', 'Spouse of')}</option>
              {/* Add other types if needed */}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="relatedMemberId">{t('relationshipManager.relatedMemberLabel', 'Related Member:')}</label>
            <select
              id="relatedMemberId"
              value={relatedMemberId}
              onChange={(e) => setRelatedMemberId(e.target.value)}
              required
              disabled={isCreating || loadingMembers}
            >
              <option value="">{t('relationshipManager.selectMember', '-- Select Member --')}</option>
              {loadingMembers ? (
                <option disabled>{t('common.loading', 'Loading...')}</option>
              ) : (
                allMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} (ID: {member.id})
                  </option>
                ))
              )}
            </select>
          </div>
          {/* Optional: Add start/end date fields here */}
          <button type="submit" disabled={isCreating || loadingMembers}>
            {isCreating ? t('common.adding', 'Adding...') : t('relationshipManager.addButton', 'Add Relationship')}
          </button>
        </form>
      </div>
      <style jsx>{`
        .relationship-manager {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
        }
        h4, h5 {
          margin-bottom: 1rem;
        }
        ul {
          list-style: none;
          padding-left: 0;
        }
        li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        li:last-child {
          border-bottom: none;
        }
        .delete-button-small {
          padding: 0.2rem 0.5rem;
          font-size: 0.8rem;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          margin-left: 1rem;
        }
        .delete-button-small:disabled {
          background-color: #6c757d;
        }
        .add-relationship-form {
          margin-top: 1.5rem;
        }
        .add-relationship-form .form-group {
          margin-bottom: 1rem;
          max-width: 400px; /* Limit width of form elements */
        }
        .add-relationship-form label {
          display: block;
          margin-bottom: 0.3rem;
        }
        .add-relationship-form select,
        .add-relationship-form button {
          width: 100%;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default RelationshipManager;