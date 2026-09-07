
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";

import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddLeadModal from "../components/AddLeadModal";

import { ROLES } from "../config/dashboardConfig";
import {
  LEADS_COPY,
  LEAD_FILTERS,
  statusClass,
} from "../config/leadsConfig";

// =====================================================
// API
// =====================================================

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/leads`
  : "http://localhost:5000/leads";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

// =====================================================
// LEADS PAGE
// =====================================================

function Leads() {
  const { user, logout } = useAuthUser();

  // ===================================================
  // STATES
  // ===================================================

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingLead, setEditingLead] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  // ===================================================
  // USER ROLE
  // ===================================================

  const role = user?.role || ROLES.ORG_ADMIN;
  const copy = LEADS_COPY[role];

  // ===================================================
  // SHOW MESSAGE
  // ===================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // ===================================================
  // GET ALL LEADS
  // ===================================================

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        headers: authHeader(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch leads"
        );
      }

      setRows(
        Array.isArray(data.leads)
          ? data.leads
          : []
      );
    } catch (err) {
      console.error("Fetch Leads Error:", err);

      setError(
        err.message || "Failed to load leads."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOAD LEADS
  // ===================================================

  useEffect(() => {
    if (user) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [user]);

  // ===================================================
  // SEARCH + FILTER
  // ===================================================

  const filteredRows = useVisibleRows(
    rows,
    activeFilter,
    search
  );

  // ===================================================
  // STATS
  // ===================================================

  const leadStats = useMemo(() => {
    const total = rows.length;

    const newLeads = rows.filter(
      (lead) => lead.status === "New"
    ).length;

    const contacted = rows.filter(
      (lead) => lead.status === "Contacted"
    ).length;

    const won = rows.filter(
      (lead) => lead.status === "Won"
    ).length;

    return {
      total,
      newLeads,
      contacted,
      won,
    };
  }, [rows]);

  // ===================================================
  // IF USER NOT LOGGED IN
  // ===================================================

  if (!user) {
    return null;
  }

  // ===================================================
  // INVALID ROLE
  // ===================================================

  if (!copy) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const handleOpenAdd = () => {
    setEditingLead(null);
    setError("");
    setIsModalOpen(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setError("");
    setIsModalOpen(true);
  };

  const handleActionToggle = (leadId, event) => {
    if (openActionMenu === leadId) {
      setOpenActionMenu(null);
      setActionMenuPosition(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const menuHeight = 92;
    const menuWidth = 130;
    const gap = 6;
    const openAbove = bounds.top >= menuHeight + gap;

    setActionMenuPosition({
      top: openAbove ? bounds.top - menuHeight - gap : bounds.bottom + gap,
      left: Math.max(8, bounds.right - menuWidth),
    });
    setOpenActionMenu(leadId);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  // ===================================================
  // ADD / UPDATE LEAD
  // ===================================================

  const handleSubmitLead = async (leadData) => {
    const isEditing = Boolean(
      editingLead?._id
    );

    try {
      setError("");

      const url = isEditing
        ? `${API_URL}/${editingLead._id}`
        : API_URL;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: authHeader(),
          body: JSON.stringify(
            leadData
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          `Failed to ${
            isEditing
              ? "update"
              : "create"
          } lead`
        );
      }

      // =================================================
      // ADD NEW LEAD
      // =================================================

      if (!isEditing) {
        if (data.lead) {
          setRows(
            (previousRows) => [
              data.lead,
              ...previousRows,
            ]
          );
        } else {
          await fetchLeads();
        }

        showMessage(
          "Lead added successfully!",
          "success"
        );
      }

      // =================================================
      // UPDATE LEAD
      // =================================================

      else {
        if (data.lead) {
          setRows(
            (previousRows) =>
              previousRows.map(
                (lead) =>
                  lead._id ===
                  editingLead._id
                    ? data.lead
                    : lead
              )
          );
        } else {
          await fetchLeads();
        }

        showMessage(
          "Lead updated successfully!",
          "success"
        );
      }

      // =================================================
      // CLOSE MODAL
      // =================================================

      setIsModalOpen(false);
      setEditingLead(null);

    } catch (err) {
      console.error(
        "Lead Save Error:",
        err
      );

      showMessage(
        err.message ||
          "Failed to save lead.",
        "error"
      );

      throw err;
    }
  };

  // ===================================================
  // DELETE LEAD
  // NO ALERT / NO CONFIRM
  // ===================================================

  const handleDelete = async (id) => {
    if (!id) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
          headers: authHeader(),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to delete lead"
        );
      }

      // Remove deleted lead immediately
      setRows(
        (previousRows) =>
          previousRows.filter(
            (lead) =>
              lead._id !== id
          )
      );

      showMessage(
        "Lead deleted successfully!",
        "success"
      );

    } catch (err) {
      console.error(
        "Delete Lead Error:",
        err
      );

      showMessage(
        err.message ||
          "Failed to delete lead.",
        "error"
      );
    }
  };

  // ===================================================
  // FORMAT VALUE
  // ===================================================

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "$0";
    }

    const cleanValue = String(value)
      .replace("$", "")
      .replace(/,/g, "");

    const numberValue =
      Number(cleanValue);

    if (
      Number.isNaN(numberValue)
    ) {
      return value;
    }

    return `$${numberValue.toLocaleString()}`;
  };

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}

      <Sidebar
        user={user}
        role={role}
        onLogout={logout}
      />

      <main className="dashboard-content">

        {/* MESSAGE */}

      {message && (
        <div className={`lead-message ${messageType === "success" ? "success" : "error"}`}>
          <span className="lead-message-icon">{messageType === "success" ? "✓" : "!"}</span>
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")} aria-label="Close message">×</button>
        </div>
      )}

        {/* HEADER */}

        <header className="dashboard-header">

          <div>
            <h1>
              {copy.title}
            </h1>

            <p>
              {copy.subtitle}
            </p>
          </div>

          <div className="header-actions">

            {/* SEARCH */}

            <div className="search-box">

              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>

              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

            {/* ADD */}

            <button
              type="button"
              className="add-lead-btn"
              onClick={handleOpenAdd}
            >
              {copy.addButtonLabel}
            </button>

          </div>

        </header>

        {/* STATS */}

        <section className="stats-grid leads-stats-grid">

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Total Leads
              </span>

              <div className="stat-icon blue">
                👥
              </div>

            </div>

            <h2>
              {leadStats.total}
            </h2>

          </div>

          <div className="stat-card">

            <div className="stat-top">

              <span>
                New
              </span>

              <div className="stat-icon green">
                ✨
              </div>

            </div>

            <h2>
              {leadStats.newLeads}
            </h2>

          </div>

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Contacted
              </span>

              <div className="stat-icon orange">
                📞
              </div>

            </div>

            <h2>
              {leadStats.contacted}
            </h2>

          </div>

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Won
              </span>

              <div className="stat-icon purple">
                🏆
              </div>

            </div>

            <h2>
              {leadStats.won}
            </h2>

          </div>

        </section>

        {/* LEADS TABLE */}

        <section className="dashboard-card leads-table-card">

          {/* FILTER BAR */}

          <div className="leads-filter-bar">

            {LEAD_FILTERS.map(
              (filter) => (
                <button
                  type="button"
                  key={filter}
                  className={`filter-chip ${
                    activeFilter === filter
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                >
                  {filter}
                </button>
              )
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div className="leads-error">
              {error}
            </div>
          )}

          {/* TABLE */}

          <div
            className="leads-table full-leads-table lead-table"
            data-with-owner={
              copy.showOwner
            }
          >

            {/* HEADER */}

            <div className="table-head">

              <span>
                Name
              </span>

              <span>
                Company
              </span>

              <span>
                Email
              </span>

              {copy.showOwner && (
                <span>
                  Owner
                </span>
              )}

              <span>
                Status
              </span>

              <span>
                Value
              </span>

              <span>
                Actions
              </span>

            </div>

            {/* LOADING */}

            {loading && (
              <div className="leads-empty">

                <div className="lead-loading-spinner" />

                <span>
                  Loading leads...
                </span>

              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              filteredRows.length === 0 && (
                <div className="leads-empty">

                  <div className="empty-icon">
                    👥
                  </div>

                  <strong>
                    No leads found
                  </strong>

                  <span>
                    {search ||
                    activeFilter !== "All"
                      ? "Try changing your search or filter. "
                      : "Add your first lead to get started."}
                  </span>

                </div>
              )}

            {/* LEAD ROWS */}

            {!loading &&
              filteredRows.map(
                (lead) => (
                  <div
                    className="lead-row"
                    key={lead._id}
                  >

                    <span className="lead-name">
                      {lead.name || "-"}
                    </span>

                    <span>
                      {lead.company || "-"}
                    </span>

                    <span>
                      {lead.email || "-"}
                    </span>

                    {copy.showOwner && (
                      <span>
                        {lead.owner || "-"}
                      </span>
                    )}

                    <span
                      className={`status ${statusClass(
                        lead.status
                      )}`}
                    >
                      {lead.status ||
                        "New"}
                    </span>

                    <span className="lead-value">
                      {formatValue(
                        lead.value
                      )}
                    </span>

                    {/* ACTION BUTTONS */}

                    <div className="lead-actions lead-actions-menu">
                      <button
                        type="button"
                        className="customer-action-trigger"
                        aria-label={`Actions for ${lead.name || "lead"}`}
                        aria-expanded={openActionMenu === lead._id}
                        onClick={(event) => handleActionToggle(lead._id, event)}
                      >
                        ⋮
                      </button>
                      {openActionMenu === lead._id && (
                        <div className="customer-action-dropdown" style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}>
                          <button type="button" onClick={() => { handleEdit(lead); setOpenActionMenu(null); }}>
                            <span className="customer-action-icon">✎</span>
                            Edit
                          </button>
                          <button type="button" className="danger" onClick={() => { handleDelete(lead._id); setOpenActionMenu(null); }}>
                            <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="m19 6-1 14H6L5 6" />
                              <path d="M10 11v5M14 11v5" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        className="edit-lead-btn"
                        onClick={() =>
                          handleEdit(
                            lead
                          )
                        }
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px",verticalAlign:"middle"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>

                      <button
                        type="button"
                        className="delete-lead-btn"
                        onClick={() =>
                          handleDelete(
                            lead._id
                          )
                        }
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px",verticalAlign:"middle"}}><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>

                    </div>

                  </div>
                )
              )}

          </div>

        </section>

      </main>

      {/* ADD / EDIT MODAL */}

      <AddLeadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitLead}
        showOwner={copy.showOwner}
        leadToEdit={editingLead}
      />

    </div>
  );
}

// =====================================================
// SEARCH + FILTER HOOK
// =====================================================

function useVisibleRows(
  rows,
  activeFilter,
  search
) {
  return useMemo(() => {

    const query =
      search.trim().toLowerCase();

    return rows.filter(
      (lead) => {

        const matchesFilter =
          activeFilter === "All" ||
          lead.status ===
            activeFilter;

        const matchesSearch =
          !query ||

          lead.name
            ?.toLowerCase()
            .includes(query) ||

          lead.company
            ?.toLowerCase()
            .includes(query) ||

          lead.email
            ?.toLowerCase()
            .includes(query) ||

          lead.phone
            ?.toLowerCase()
            .includes(query) ||

          lead.owner
            ?.toLowerCase()
            .includes(query);

        return (
          matchesFilter &&
          matchesSearch
        );
      }
    );

  }, [
    rows,
    activeFilter,
    search,
  ]);
}

export default Leads;

