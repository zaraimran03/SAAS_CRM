import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";

import { useAuthUser }  from "../hooks/useAuthUser";
import Sidebar          from "../components/Sidebar";
import AddDealModal     from "../components/AddDealModal";

import { ROLES }        from "../config/dashboardConfig";
import {
  DEALS_COPY,
  DEAL_FILTERS,
  stageClass,
  stageColor,
} from "../config/dealsConfig";

// ======================================================
// API URL
// ======================================================

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/deals`
  : "http://localhost:5000/deals";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});
// ======================================================
// HELPERS
// ======================================================

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "$0";
  const clean = String(value).replace("$", "").replace(/,/g, "");
  const num   = Number(clean);
  if (Number.isNaN(num)) return value;
  return `$${num.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
      year:  "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ======================================================
// SEARCH + FILTER HOOK
// ======================================================

function useVisibleDeals(deals, activeFilter, search) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchesFilter =
        activeFilter === "All" || deal.stage === activeFilter;

      const matchesSearch =
        !q ||
        deal.title?.toLowerCase().includes(q)   ||
        deal.company?.toLowerCase().includes(q) ||
        deal.contact?.toLowerCase().includes(q) ||
        deal.owner?.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [deals, activeFilter, search]);
}

// ======================================================
// DEALS PAGE
// ======================================================

function Deals() {
  const { user, logout } = useAuthUser();

  // ====================================================
  // STATE
  // ====================================================

  const [deals,       setDeals]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const [message,     setMessage]     = useState("");
  const [messageType, setMessageType] = useState("success");

  const [search,       setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingDeal,  setEditingDeal]  = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'kanban'
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  // ====================================================
  // ROLE
  // ====================================================

  const role = user?.role || ROLES.ORG_ADMIN;
  const copy = DEALS_COPY[role];

  // ====================================================
  // SHOW MESSAGE
  // ====================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  // ====================================================
  // FETCH
  // ====================================================

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError("");
      const res  = await fetch(API_URL, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch deals");
      setDeals(Array.isArray(data.deals) ? data.deals : []);
    } catch (err) {
      setError(err.message || "Failed to load deals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDeals();
    else setLoading(false);
  }, [user]);

  // ====================================================
  // FILTERED ROWS + STATS
  // ====================================================

  const filteredDeals = useVisibleDeals(deals, activeFilter, search);

  const stats = useMemo(() => {
    const total = deals.length;
    const won   = deals.filter((d) => d.stage === "Won").length;
    const lost  = deals.filter((d) => d.stage === "Lost").length;

    const totalValue = deals.reduce((acc, d) => {
      const n = Number(String(d.value || "0").replace("$", "").replace(/,/g, ""));
      return acc + (Number.isNaN(n) ? 0 : n);
    }, 0);

    const wonValue = deals
      .filter((d) => d.stage === "Won")
      .reduce((acc, d) => {
        const n = Number(String(d.value || "0").replace("$", "").replace(/,/g, ""));
        return acc + (Number.isNaN(n) ? 0 : n);
      }, 0);

    return { total, won, lost, totalValue, wonValue };
  }, [deals]);

  // ====================================================
  // GUARD
  // ====================================================

  if (!user) return null;
  if (!copy) return <Navigate to="/dashboard" replace />;

  // ====================================================
  // MODAL HANDLERS
  // ====================================================

  const handleOpenAdd = () => {
    setEditingDeal(null);
    setIsModalOpen(true);
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
  };

  // ====================================================
  // SUBMIT (ADD / UPDATE)
  // ====================================================

  const handleSubmitDeal = async (dealData) => {
    const isEditing = Boolean(editingDeal?._id);
    const url       = isEditing ? `${API_URL}/${editingDeal._id}` : API_URL;
    const method    = isEditing ? "PUT" : "POST";

    const res  = await fetch(url, {
      method,
      headers: authHeader(),
      body:    JSON.stringify(dealData),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Failed to save deal.", "error");
      throw new Error(data.message);
    }

    if (!isEditing) {
      setDeals((prev) => data.deal ? [data.deal, ...prev] : prev);
      showMessage("Deal added successfully!", "success");
    } else {
      setDeals((prev) =>
        prev.map((d) => (d._id === editingDeal._id ? data.deal : d))
      );
      showMessage("Deal updated successfully!", "success");
    }

    setIsModalOpen(false);
    setEditingDeal(null);
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (id) => {
    if (!id) return;

    const res  = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Failed to delete deal.", "error");
      return;
    }

    setDeals((prev) => prev.filter((d) => d._id !== id));
    showMessage("Deal deleted successfully!", "success");
  };

  const handleActionToggle = (dealId, event) => {
    if (openActionMenu === dealId) {
      setOpenActionMenu(null);
      setActionMenuPosition(null);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const menuHeight = 92;
    const menuWidth = 130;
    const gap = 6;
    setActionMenuPosition({
      top: bounds.top >= menuHeight + gap ? bounds.top - menuHeight - gap : bounds.bottom + gap,
      left: Math.max(8, bounds.right - menuWidth),
    });
    setOpenActionMenu(dealId);
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}
      <Sidebar user={user} role={role} onLogout={logout} />

      {/* MAIN */}
      <main className="dashboard-content">

        {/* TOAST MESSAGE */}
        {message && (
          <div className={`lead-message ${messageType === "success" ? "success" : "error"}`}>
            <span className="lead-message-icon">
              {messageType === "success" ? "✓" : "!"}
            </span>
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")} aria-label="Dismiss">×</button>
          </div>
        )}

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <div className="header-actions">
            <div className="view-toggle" style={{ display: "flex", gap: "10px" }}>
              <button 
                type="button" 
                className={`add-lead-btn ${viewMode === "table" ? "active" : ""}`}
                style={{ background: viewMode === "table" ? "#3b82f6" : "#e2e8f0", color: viewMode === "table" ? "white" : "#475569" }}
                onClick={() => setViewMode("table")}
              >
                Table
              </button>
              <button 
                type="button" 
                className={`add-lead-btn ${viewMode === "kanban" ? "active" : ""}`}
                style={{ background: viewMode === "kanban" ? "#3b82f6" : "#e2e8f0", color: viewMode === "kanban" ? "white" : "#475569" }}
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </button>
            </div>
            <div className="search-box">
              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="add-lead-btn" onClick={handleOpenAdd}>
              {copy.addButtonLabel}
            </button>
          </div>
        </header>

        {/* STAT CARDS */}
        <section className="stats-grid leads-stats-grid">

          <div className="stat-card">
            <div className="stat-top">
              <span>Total Deals</span>
              <div className="stat-icon blue">◇</div>
            </div>
            <h2>{stats.total}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Won</span>
              <div className="stat-icon green">🏆</div>
            </div>
            <h2>{stats.won}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Lost</span>
              <div className="stat-icon orange">✕</div>
            </div>
            <h2>{stats.lost}</h2>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Pipeline Value</span>
              <div className="stat-icon purple">$</div>
            </div>
            <h2 style={{ fontSize: "20px" }}>{formatValue(stats.totalValue)}</h2>
          </div>

        </section>

        {/* DEALS TABLE */}
        <section className="dashboard-card leads-table-card">

          {/* FILTER BAR */}
          <div className="leads-filter-bar">
            {DEAL_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-chip ${activeFilter === f ? "active" : ""}`}
                onClick={() => setActiveFilter(f)}
                style={
                  activeFilter === f && f !== "All"
                    ? { borderColor: stageColor(f), color: stageColor(f) }
                    : {}
                }
              >
                {f}
              </button>
            ))}
          </div>

          {/* CONTENT: TABLE OR KANBAN */}
          {viewMode === "table" ? (
            <div
              className="leads-table full-leads-table deal-table"
              data-with-owner={copy.showOwner}
            >
              {/* TABLE HEADER */}
              <div className="table-head" style={{
                gridTemplateColumns: copy.showOwner
                  ? "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 72px"
                  : "1.5fr 1fr 1fr 1fr 1fr 1fr 72px",
              }}>
                <span>Title</span>
                {copy.showOwner && <span>Owner</span>}
                <span>Stage</span>
                <span>Status</span>
                <span>Previous Value</span>
                <span>Now Value</span>
                <span>Close Date</span>
                <span>Actions</span>
              </div>

              {/* LOADING */}
              {loading && (
                <div className="leads-empty">
                  <div className="lead-loading-spinner" />
                  <span>Loading deals...</span>
                </div>
              )}

              {/* EMPTY */}
              {!loading && filteredDeals.length === 0 && (
                <div className="leads-empty">
                  <div className="empty-icon">◇</div>
                  <strong>No deals found</strong>
                  <span>
                    {search || activeFilter !== "All"
                      ? "Try changing your search or filter."
                      : "Add your first deal to get started."}
                  </span>
                </div>
              )}

              {/* ROWS */}
              {!loading && filteredDeals.map((deal) => (
                <div
                  key={deal._id}
                  className="lead-row"
                  style={{
                    gridTemplateColumns: copy.showOwner
                      ? "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 72px"
                      : "1.5fr 1fr 1fr 1fr 1fr 1fr 72px",
                  }}
                >
                  <span className="lead-name" title={deal.title}>
                    {deal.title || "—"}
                  </span>

                  {copy.showOwner && <span>{deal.owner || "—"}</span>}

                  <span className={`status ${stageClass(deal.stage)}`}>
                    {deal.stage || "Qualification"}
                  </span>

                  <span className="status" style={{ color: deal.status === "Inactive" ? "#b45309" : "#16a34a" }}>
                    {deal.status || "Active"}
                  </span>

                  <span className="lead-value" style={{ color: deal.previousValue ? "#dc2626" : "#94a3b8", textDecoration: deal.previousValue ? "line-through" : "none" }}>
                    {deal.previousValue ? `${formatValue(deal.previousValue)} ×` : "—"}
                  </span>

                  <span className="lead-value">{formatValue(deal.value)}</span>

                  <span style={{ fontSize: "10px", color: "#6b7280" }}>
                    {formatDate(deal.closeDate)}
                  </span>

                  <div className="customer-action-menu lead-actions-menu" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="customer-action-trigger"
                      aria-label={`Actions for ${deal.title || "deal"}`}
                      aria-expanded={openActionMenu === deal._id}
                      onClick={(event) => handleActionToggle(deal._id, event)}
                    >
                      ⋮
                    </button>
                    {openActionMenu === deal._id && (
                      <div className="customer-action-dropdown" style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}>
                        <button type="button" onClick={() => { handleEdit(deal); setOpenActionMenu(null); }}>
                          <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => { handleDelete(deal._id); setOpenActionMenu(null); }}>
                          <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
                          Delete
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="edit-lead-btn"
                      onClick={() => handleEdit(deal)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"0",verticalAlign:"middle"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      type="button"
                      className="delete-lead-btn"
                      onClick={() => handleDelete(deal._id)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"0",verticalAlign:"middle"}}><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="kanban-board" style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "16px", minHeight: "400px" }}>
              {DEAL_FILTERS.filter(f => f !== "All").map(stage => {
                const stageDeals = filteredDeals.filter(d => d.stage === stage);
                return (
                  <div key={stage} className="kanban-column" style={{ flex: "0 0 280px", background: "#f8fafc", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#475569", marginBottom: "12px", display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${stageColor(stage)}`, paddingBottom: "8px" }}>
                      {stage} <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>{stageDeals.length}</span>
                    </h3>
                    <div className="kanban-deals" style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                      {stageDeals.map(deal => (
                        <div key={deal._id} className="kanban-card" style={{ background: "white", padding: "12px", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", cursor: "pointer" }} onClick={() => handleEdit(deal)}>
                          <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px", marginBottom: "4px" }}>{deal.title}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "600", color: "#3b82f6", fontSize: "13px" }}>{formatValue(deal.value)}</span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatDate(deal.closeDate)}</span>
                          </div>
                        </div>
                      ))}
                      {stageDeals.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", padding: "20px 0" }}>No deals</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* ADD / EDIT MODAL */}
      <AddDealModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitDeal}
        showOwner={copy.showOwner}
        editingDeal={editingDeal}
      />

    </div>
  );
}

export default Deals;
