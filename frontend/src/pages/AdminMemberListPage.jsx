import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import familyTreeService from "../services/familyTreeService";

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const AdminMemberListPage = () => {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const debouncedSetSearch = React.useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
    }, 500),
    [],
  );

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const fetchMembers = async (page = 1, search = debouncedSearchTerm) => {
    setLoading(true);
    setError("");
    setActionMessage({ type: "", text: "" });
    try {
      const data = await familyTreeService.getMembersAdmin(
        page,
        itemsPerPage,
        search,
      );
      setMembers(data.items);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      setSelectedMemberIds(new Set());
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(
        err.response?.data?.detail ||
          t("adminMemberList.errorFetch", "Failed to fetch members."),
      );
      setMembers([]);
      setTotalPages(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCheckboxChange = (memberId, isChecked) => {
    setSelectedMemberIds((prev) => {
      const newSelection = new Set(prev);
      if (isChecked) {
        newSelection.add(memberId);
      } else {
        newSelection.delete(memberId);
      }
      return newSelection;
    });
  };

  const handleSelectAllChange = (event) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedMemberIds(new Set(members.map((m) => m.id)));
    } else {
      setSelectedMemberIds(new Set());
    }
  };

  const isAllSelected =
    members.length > 0 && selectedMemberIds.size === members.length;

  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        t(
          "adminMemberList.confirmDelete",
          `Are you sure you want to delete ${name}? This action cannot be undone.`,
          { name },
        ),
      )
    ) {
      setLoading(true);
      setActionMessage({ type: "", text: "" });
      try {
        await familyTreeService.deleteMemberAdmin(id);
        setActionMessage({
          type: "success",
          text: t(
            "adminMemberList.deleteSuccess",
            `${name} deleted successfully.`,
            { name },
          ),
        });
        const pageToFetch =
          members.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage;
        setSelectedMemberIds((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(id);
          return newSelection;
        });
        fetchMembers(pageToFetch);
      } catch (err) {
        console.error(`Error deleting member ${id}:`, err);
        setActionMessage({
          type: "error",
          text:
            err.response?.data?.detail ||
            t("adminMemberList.errorDelete", `Failed to delete ${name}.`, {
              name,
            }),
        });
        setLoading(false);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedMemberIds.size === 0) {
      setActionMessage({
        type: "error",
        text: t(
          "adminMemberList.errorNoSelection",
          "Please select members to delete.",
        ),
      });
      return;
    }

    const confirmMessage = t(
      "adminMemberList.confirmBatchDelete",
      `Are you sure you want to delete ${selectedMemberIds.size} selected members? This action cannot be undone.`,
      { count: selectedMemberIds.size },
    );
    if (window.confirm(confirmMessage)) {
      setIsBatchDeleting(true);
      setActionMessage({ type: "", text: "" });
      try {
        const idsToDelete = Array.from(selectedMemberIds);
        const response =
          await familyTreeService.batchDeleteMembersAdmin(idsToDelete);
        setActionMessage({
          type: "success",
          text:
            response.message ||
            t(
              "adminMemberList.batchDeleteSuccess",
              `Successfully deleted ${response.deleted_count} members.`,
              { count: response.deleted_count },
            ),
        });
        const pageToFetch = currentPage;
        setSelectedMemberIds(new Set());
        fetchMembers(pageToFetch);
      } catch (err) {
        console.error("Error batch deleting members:", err);
        setActionMessage({
          type: "error",
          text:
            err.response?.data?.detail ||
            t(
              "adminMemberList.errorBatchDelete",
              "Failed to delete selected members.",
            ),
        });
      } finally {
        setIsBatchDeleting(false);
      }
    }
  };

  return (
    <div>
      <h2>{t("adminMemberList.title", "Manage Family Members")}</h2>
      {error && <div className="message message-error">{error}</div>}
      {actionMessage.text && (
        <div
          className={`message ${actionMessage.type === "success" ? "message-success" : "message-error"}`}
        >
          {actionMessage.text}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link to="/admin/members/add" className="button add-button">
            {t("adminMemberList.addMemberButton", "Add New Member")}
          </Link>
          <button
            onClick={handleBatchDelete}
            className="button delete-button"
            disabled={
              selectedMemberIds.size === 0 || loading || isBatchDeleting
            }
          >
            {isBatchDeleting
              ? t("common.deleting", "Deleting...")
              : t(
                  "adminMemberList.deleteSelectedButton",
                  "Delete Selected ({{count}})",
                  { count: selectedMemberIds.size },
                )}
          </button>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder={t(
              "adminMemberList.searchPlaceholder",
              "Search by name...",
            )}
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ padding: "0.5rem" }}
          />
        </div>
      </div>
      {loading ? (
        <div>{t("adminMemberList.loading", "Loading members...")}</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAllChange}
                  checked={isAllSelected}
                  disabled={members.length === 0}
                  title={t(
                    "adminMemberList.selectAllTooltip",
                    "Select all on this page",
                  )}
                />
              </th>
              <th>{t("adminMemberList.tableHeaderName", "Name")}</th>
              <th>{t("adminMemberList.tableHeaderBirthDate", "Birth Date")}</th>
              <th>{t("adminMemberList.tableHeaderActions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.has(member.id)}
                      onChange={(e) =>
                        handleCheckboxChange(member.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{member.name}</td>
                  <td>
                    {member.birth_date || t("common.notSpecified", "N/A")}
                  </td>
                  <td>
                    <Link
                      to={`/admin/members/edit/${member.id}`}
                      className="button edit-button"
                    >
                      {t("adminMemberList.editButton", "Edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="button delete-button"
                      disabled={loading || isBatchDeleting}
                    >
                      {t("adminMemberList.deleteButton", "Delete")}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">
                  {t("adminMemberList.noMembers", "No members found.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {!loading && totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => fetchMembers(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            {t("pagination.previous", "Previous")}
          </button>
          <span>
            {t(
              "pagination.pageInfo",
              "Page {{currentPage}} of {{totalPages}}",
              { currentPage, totalPages },
            )}
          </span>
          <button
            onClick={() => fetchMembers(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            {t("pagination.next", "Next")}
          </button>
        </div>
      )}
      <style jsx>{`
        .add-button {
          display: inline-block;
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          background-color: #28a745;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .add-button:hover {
          background-color: #218838;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        th,
        td {
          border: 1px solid #dee2e6;
          padding: 0.75rem;
          text-align: left;
        }
        th {
          background-color: #e9ecef;
        }
        .button {
          padding: 0.3rem 0.6rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-right: 0.5rem;
          font-size: 0.9rem;
        }
        .edit-button {
          background-color: #ffc107;
          color: #212529;
        }
        .edit-button:hover {
          background-color: #e0a800;
        }
        .delete-button {
          background-color: #dc3545;
          color: white;
        }
        .delete-button:hover {
          background-color: #c82333;
        }
        .pagination-controls {
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }
        .pagination-controls button {
          padding: 0.5rem 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .pagination-controls button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        .pagination-controls span {
          font-size: 0.9rem;
        }
        .search-container input {
          min-width: 250px;
        }
      `}</style>
    </div>
  );
};

export default AdminMemberListPage;
