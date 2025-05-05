import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import familyTreeService from "../services/familyTreeService"; // Import the service

// Simple debounce utility function
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
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" }); // Combined message state
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [totalItems, setTotalItems] = useState(0); // Removed unused state
  const itemsPerPage = 10; // Or make this configurable
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm); // Initialize with searchTerm
  // Batch delete state
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Debounce search input
  // Use useCallback for debounced search to avoid re-creating timeout function unnecessarily
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = React.useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1); // Reset page on new search
    }, 500), // 500ms delay
    [],
  ); // Empty dependency array means this function is created once

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const fetchMembers = async (page = 1, search = debouncedSearchTerm) => {
    setLoading(true);
    setError("");
    setActionMessage({ type: "", text: "" }); // Clear previous messages
    try {
      // Fetch paginated data with search term
      const data = await familyTreeService.getMembersAdmin(
        page,
        itemsPerPage,
        search,
      );
      setMembers(data.items);
      // setTotalItems(data.total_items); // Removed unused state setter
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      // Clear selection when data is fetched for a new page/search
      setSelectedMemberIds(new Set());
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(
        err.response?.data?.detail ||
          t("adminMemberList.errorFetch", "Failed to fetch members."),
      );
      // Reset pagination state on error?
      setMembers([]);
      // setTotalItems(0); // Removed usage of removed state setter
      setTotalPages(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch members whenever page or debounced search term changes
    fetchMembers(currentPage, debouncedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]); // Add debouncedSearchTerm dependency

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // --- Batch Selection Handlers ---
  // Handle individual checkbox change
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

  // Handle "select all" checkbox change
  const handleSelectAllChange = (event) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      // Select all members currently displayed on the page
      setSelectedMemberIds(new Set(members.map((m) => m.id)));
    } else {
      setSelectedMemberIds(new Set());
    }
  };

  // Determine if "select all" checkbox should be checked
  const isAllSelected =
    members.length > 0 && selectedMemberIds.size === members.length;
  // --- End Batch Selection Handlers ---

  const handleDelete = async (id, name) => {
    // Simple confirmation
    if (
      window.confirm(
        t(
          "adminMemberList.confirmDelete",
          `Are you sure you want to delete ${name}? This action cannot be undone.`,
          { name },
        ),
      )
    ) {
      // Add confirm key
      setLoading(true);
      setActionMessage({ type: "", text: "" }); // Use combined message state
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
        // Re-fetch the *current* page after deletion
        const pageToFetch =
          members.length === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage;
        // Ensure the deleted ID is removed from selection if it was selected
        setSelectedMemberIds((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(id);
          return newSelection;
        });
        fetchMembers(pageToFetch); // This will reset loading state
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
        setLoading(false); // Stop loading on error
      }
    }
  };

  // --- Batch Delete Handler ---
  const handleBatchDelete = async () => {
    if (selectedMemberIds.size === 0) {
      setActionMessage({
        type: "error",
        text: t(
          "adminMemberList.errorNoSelection",
          "Please select members to delete.",
        ),
      }); // Add key
      return;
    }

    const confirmMessage = t(
      "adminMemberList.confirmBatchDelete",
      `Are you sure you want to delete ${selectedMemberIds.size} selected members? This action cannot be undone.`,
      { count: selectedMemberIds.size },
    ); // Add key
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
        }); // Add key
        // Re-fetch the current page, adjusting if necessary
        const pageToFetch = currentPage; // Simple approach: stay on current page
        // Reset selection and fetch potentially adjusted page
        setSelectedMemberIds(new Set());
        fetchMembers(pageToFetch); // This resets loading state
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
        }); // Add key
      } finally {
        setIsBatchDeleting(false);
      }
    }
  };
  // --- End Batch Delete Handler ---

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
          {/* Batch Delete Button */}
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
        {/* Search Input */}
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
                {/* Select All Checkbox */}
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
                    {/* Individual Checkbox */}
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
      {/* Pagination Controls */}
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
          text-decoration: none; /* For Link */
          display: inline-block; /* For Link */
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
          min-width: 250px; /* Give search input some width */
        }
      `}</style>
    </div>
  );
};

export default AdminMemberListPage;
