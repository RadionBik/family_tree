import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import familyTreeService from "../services/familyTreeService";

const RelationshipItem = ({ relation, currentMemberId, onDelete, members }) => {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  let relatedMemberId = null;
  let relationDescriptionKey = "";
  let relationDescriptionContext = {};

  if (relation.from_member_id === currentMemberId) {
    relatedMemberId = relation.to_member_id;
    if (relation.relation_type === "parent")
      relationDescriptionKey = "relationDesc.isParentOf";
    else if (relation.relation_type === "spouse")
      relationDescriptionKey = "relationDesc.isSpouseOf";
    else relationDescriptionKey = "relationDesc.isRelatedTo";
  } else {
    relatedMemberId = relation.from_member_id;
    if (relation.relation_type === "parent")
      relationDescriptionKey = "relationDesc.isChildOf";
    else if (relation.relation_type === "spouse")
      relationDescriptionKey = "relationDesc.isSpouseOf";
    else relationDescriptionKey = "relationDesc.isRelatedTo";
  }

  const relatedMember = members.find((m) => m.id === relatedMemberId);
  const relatedMemberName = relatedMember
    ? relatedMember.name
    : t("common.unknown", "Unknown");
  relationDescriptionContext = { name: relatedMemberName };

  const handleDelete = async () => {
    const confirmMessage = t(
      "relationshipManager.confirmDeleteRelation",
      "Are you sure you want to delete this relationship?",
      {
        type: t(
          `relationType.${relation.relation_type}`,
          relation.relation_type,
        ),
        name: relatedMemberName,
      },
    );
    if (window.confirm(confirmMessage)) {
      setIsDeleting(true);
      try {
        await familyTreeService.deleteRelationshipAdmin(relation.id);
        onDelete(relation.id, "success");
      } catch (error) {
        console.error(`Error deleting relationship ${relation.id}:`, error);
        onDelete(
          relation.id,
          "error",
          error.response?.data?.detail ||
            t(
              "relationshipManager.errorDelete",
              "Failed to delete relationship.",
            ),
        );
        setIsDeleting(false);
      }
    }
  };

  return (
    <li>
      {t(relationDescriptionKey, relationDescriptionContext)}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="delete-button-small"
      >
        {isDeleting
          ? t("common.deleting", "Deleting...")
          : t("common.delete", "Delete")}
      </button>
    </li>
  );
};

const RelationshipManager = ({
  memberId,
  relationshipsFrom,
  relationshipsTo,
  onRelationshipChange,
}) => {
  const { t } = useTranslation();
  const [allMembers, setAllMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const [relatedMemberId, setRelatedMemberId] = useState("");
  const [relationType, setRelationType] = useState("parent");
  const [isCreating, setIsCreating] = useState(false);

  const allRelations = [...relationshipsFrom, ...relationshipsTo];

  useEffect(() => {
    setLoadingMembers(true);
    familyTreeService
      .getMembersAdmin()
      .then((data) => {
        setAllMembers(data.filter((m) => m.id !== memberId));
      })
      .catch((err) => {
        console.error("Error fetching members for relationship manager:", err);
        setError(
          t(
            "relationshipManager.errorFetchMembers",
            "Failed to load members list.",
          ),
        );
      })
      .finally(() => setLoadingMembers(false));
  }, [memberId, t]);

  const handleCreateRelationship = async (e) => {
    e.preventDefault();
    if (!relatedMemberId) {
      setMessage({
        type: "error",
        text: t(
          "relationshipManager.errorSelectMember",
          "Please select a member to relate.",
        ),
      });
      return;
    }
    setIsCreating(true);
    setMessage({ type: "", text: "" });

    try {
      let fromId = memberId;
      let toId = parseInt(relatedMemberId, 10);
      let type = relationType;

      if (relationType === "child") {
        fromId = parseInt(relatedMemberId, 10);
        toId = memberId;
        type = "parent";
      }

      await familyTreeService.createRelationshipAdmin(fromId, toId, type);
      setMessage({
        type: "success",
        text: t(
          "relationshipManager.createSuccess",
          "Relationship added successfully.",
        ),
      });
      setRelatedMemberId("");
      setRelationType("parent");
      onRelationshipChange("create", "success");
    } catch (error) {
      console.error("Error creating relationship:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          t("relationshipManager.errorCreate", "Failed to add relationship."),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRelationDeleted = (relationId, status, errorText = "") => {
    if (status === "success") {
      setMessage({
        type: "success",
        text: t(
          "relationshipManager.deleteSuccess",
          "Relationship deleted successfully.",
        ),
      });
      onRelationshipChange("delete", "success");
    } else {
      setMessage({ type: "error", text: errorText });
    }
  };

  return (
    <div className="relationship-manager">
      <h4>{t("relationshipManager.title", "Manage Relationships")}</h4>

      {error && <div className="message message-error">{error}</div>}
      {message.text && (
        <div
          className={`message ${message.type === "success" ? "message-success" : "message-error"}`}
        >
          {message.text}
        </div>
      )}

      <div className="existing-relationships">
        <h5>
          {t("relationshipManager.existingTitle", "Existing Relationships:")}
        </h5>
        {allRelations.length > 0 ? (
          <ul>
            {allRelations.map((rel) => (
              <RelationshipItem
                key={rel.id}
                relation={rel}
                currentMemberId={memberId}
                onDelete={handleRelationDeleted}
                members={allMembers}
              />
            ))}
          </ul>
        ) : (
          <p>
            {t(
              "relationshipManager.noExisting",
              "No relationships defined yet.",
            )}
          </p>
        )}
      </div>

      <div className="add-relationship-form">
        <h5>{t("relationshipManager.addTitle", "Add New Relationship")}</h5>
        <form onSubmit={handleCreateRelationship}>
          <div className="form-group">
            <label htmlFor="relationType">
              {t("relationshipManager.relationTypeLabel", "Relationship Type:")}
            </label>
            <select
              id="relationType"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              disabled={isCreating || loadingMembers}
            >
              <option value="parent">
                {t("relationType.parent", "Parent of")}
              </option>
              <option value="child">
                {t("relationType.child", "Child of")}
              </option>
              <option value="spouse">
                {t("relationType.spouse", "Spouse of")}
              </option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="relatedMemberId">
              {t("relationshipManager.relatedMemberLabel", "Related Member:")}
            </label>
            <select
              id="relatedMemberId"
              value={relatedMemberId}
              onChange={(e) => setRelatedMemberId(e.target.value)}
              required
              disabled={isCreating || loadingMembers}
            >
              <option value="">
                {t("relationshipManager.selectMember", "-- Select Member --")}
              </option>
              {loadingMembers ? (
                <option disabled>{t("common.loading", "Loading...")}</option>
              ) : (
                allMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} (ID: {member.id})
                  </option>
                ))
              )}
            </select>
          </div>
          <button type="submit" disabled={isCreating || loadingMembers}>
            {isCreating
              ? t("common.adding", "Adding...")
              : t("relationshipManager.addButton", "Add Relationship")}
          </button>
        </form>
      </div>
      <style jsx>{`
        .relationship-manager {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
        }
        h4,
        h5 {
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
          max-width: 400px;
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
