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

          {error && <div className="leads-error">{error}</div>}

          {/* TABLE */}
          <div
            className="leads-table full-leads-table"
            data-with-owner={copy.showOwner}
          >

            {/* TABLE HEADER */}
            <div className="table-head" style={{
              gridTemplateColumns: copy.showOwner
                ? "1.5fr 1.2fr 1fr 1fr 1fr 0.9fr 100px"
                : "1.5fr 1.2fr 1fr 1fr 1fr 100px",
            }}>
              <span>Title</span>
              <span>Company</span>
              {copy.showOwner && <span>Owner</span>}
              <span>Stage</span>
              <span>Value</span>
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
                    ? "1.5fr 1.2fr 1fr 1fr 1fr 0.9fr 100px"
                    : "1.5fr 1.2fr 1fr 1fr 1fr 100px",
                }}
              >
                <span className="lead-name" title={deal.title}>
                  {deal.title || "—"}
                </span>

                <span>{deal.company || "—"}</span>

                {copy.showOwner && <span>{deal.owner || "—"}</span>}

                <span className={`status ${stageClass(deal.stage)}`}>
                  {deal.stage || "Qualification"}
                </span>

                <span className="lead-value">{formatValue(deal.value)}</span>

                <span style={{ fontSize: "10px", color: "#6b7280" }}>
                  {formatDate(deal.closeDate)}
                </span>

                <div className="lead-actions">
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
