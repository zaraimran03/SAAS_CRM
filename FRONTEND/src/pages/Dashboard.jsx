import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Dashboard.css";

import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddLeadModal from "../components/AddLeadModal";
import { ROLES } from "../config/dashboardConfig";

// ======================================================
// API URLS
// ======================================================

const LEADS_API    = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/leads`
  : "http://localhost:5000/leads";

const CUSTOMERS_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/customers`
  : "http://localhost:5000/customers";

// ======================================================
// STATUS CLASS HELPER
// ======================================================

const STATUS_CLASS = {
  New:         "new-status",
  Contacted:   "contacted-status",
  Proposal:    "proposal-status",
  Negotiation: "negotiation-status",
  Won:         "won-status",
};

function statusClass(status) {
  return STATUS_CLASS[status] || "new-status";
}

// ======================================================
// GREETING HELPER
// ======================================================

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ======================================================
// FORMAT VALUE HELPER
// ======================================================

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "$0";
  const clean  = String(value).replace("$", "").replace(/,/g, "");
  const num    = Number(clean);
  if (Number.isNaN(num)) return value;
  return `$${num.toLocaleString()}`;
}

// ======================================================
// PIPELINE STAGES
// ======================================================

const PIPELINE_STAGES = [
  { label: "New",         colorClass: "blue-fill"   },
  { label: "Contacted",   colorClass: "purple-fill" },
  { label: "Proposal",    colorClass: "orange-fill" },
  { label: "Negotiation", colorClass: "pink-fill"   },
  { label: "Won",         colorClass: "green-fill"  },
];

// ======================================================
// DASHBOARD
// ======================================================

function Dashboard() {
  const { user, logout } = useAuthUser();
  const navigate         = useNavigate();

  const role = user?.role || ROLES.ORG_ADMIN;

  // ====================================================
  // STATE
  // ====================================================

  const [leads,     setLeads]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  // ====================================================
  // FETCH DATA
  // ====================================================

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        const headers = {
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        };

        const [leadsRes, customersRes] = await Promise.all([
          fetch(LEADS_API, { headers }),
          fetch(CUSTOMERS_API, { headers }),
        ]);

        const leadsData     = await leadsRes.json().catch(() => ({}));
        const customersData = await customersRes.json().catch(() => ({}));

        setLeads(Array.isArray(leadsData.leads)          ? leadsData.leads         : []);
        setCustomers(Array.isArray(customersData.customers) ? customersData.customers : []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // ====================================================
  // COMPUTED STATS
  // ====================================================

  const stats = useMemo(() => {
    const totalLeads     = leads.length;
    const wonLeads       = leads.filter((l) => l.status === "Won").length;
    const activeCustomers = customers.filter((c) => c.status === "Active").length;
    const winRate        = totalLeads > 0
      ? ((wonLeads / totalLeads) * 100).toFixed(1)
      : "0.0";

    return { totalLeads, wonLeads, activeCustomers, winRate };
  }, [leads, customers]);

  // ====================================================
  // PIPELINE COUNTS
  // ====================================================

  const pipelineCounts = useMemo(() => {
    const total = leads.length || 1; // avoid divide-by-zero
    return PIPELINE_STAGES.map((stage) => {
      const count = leads.filter((l) => l.status === stage.label).length;
      const pct   = Math.round((count / total) * 100);
      return { ...stage, count, pct };
    });
  }, [leads]);

  // ====================================================
  // RECENT LEADS (latest 5)
  // ====================================================

  const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

  const handleAddLead = async (leadData) => {
    const response = await fetch(LEADS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify(leadData),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to create lead");
    }

    if (data.lead) {
      setLeads((previousLeads) => [data.lead, ...previousLeads]);
    }
    setIsLeadModalOpen(false);
  };

  // ====================================================
  // GUARD
  // ====================================================

  if (!user) return null;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}
      <Sidebar user={user} role={role} onLogout={logout} />

      {/* MAIN */}
      <main className="dashboard-content">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>{getGreeting()}, {user.fullName?.split(" ")[0]}!</h1>
            <p>Here's what's happening with your sales team today.</p>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" placeholder="Search anything..." />
            </div>

            <button
              type="button"
              className="add-lead-btn"
              onClick={() => setIsLeadModalOpen(true)}
            >
              + Add new lead
            </button>
          </div>
        </header>

        {/* STAT CARDS */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-top">
              <span>Total Leads</span>
              <div className="stat-icon blue">◎</div>
            </div>
            <h2>{loading ? "—" : stats.totalLeads.toLocaleString()}</h2>
            <p className="positive">
              Live <span>from database</span>
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Won Leads</span>
              <div className="stat-icon green">🏆</div>
            </div>
            <h2>{loading ? "—" : stats.wonLeads.toLocaleString()}</h2>
            <p className="positive">
              Live <span>from database</span>
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Active Customers</span>
              <div className="stat-icon purple">●</div>
            </div>
            <h2>{loading ? "—" : stats.activeCustomers.toLocaleString()}</h2>
            <p className="positive">
              Live <span>from database</span>
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Win Rate</span>
              <div className="stat-icon orange">%</div>
            </div>
            <h2>{loading ? "—" : `${stats.winRate}%`}</h2>
            <p className={Number(stats.winRate) >= 20 ? "positive" : "negative"}>
              {Number(stats.winRate) >= 20 ? "On target" : "Below target"}{" "}
              <span>from database</span>
            </p>
          </div>

        </section>

        {/* MIDDLE SECTION */}
        <section className="middle-grid">

          {/* PIPELINE BY STAGE */}
          <div className="dashboard-card revenue-card">
            <div className="card-heading">
              <div>
                <h3>Pipeline by Stage</h3>
                <p>{loading ? "Loading..." : `${stats.totalLeads} total leads across all stages`}</p>
              </div>
            </div>

            {loading ? (
              <div className="dash-loading">Loading pipeline...</div>
            ) : stats.totalLeads === 0 ? (
              <div className="dash-empty">
                <span>No leads yet.</span>
                <button
                  type="button"
                  className="add-lead-btn"
                  style={{ marginTop: "12px" }}
                  onClick={() => setIsLeadModalOpen(true)}
                >
                  + Add your first lead
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "16px" }}>
                {pipelineCounts.map((stage) => (
                  <div className="deal-row" key={stage.label}>
                    <span>{stage.label}</span>
                    <div className="progress">
                      <div
                        className={`progress-fill ${stage.colorClass}`}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                    <strong>{stage.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QUICK SUMMARY */}
          <div className="dashboard-card deals-card">
            <div className="card-heading">
              <div>
                <h3>Quick Summary</h3>
                <p>Snapshot of your data</p>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>

              {[
                { label: "Total Leads",        value: loading ? "—" : stats.totalLeads,        icon: "◎", color: "#2878ee" },
                { label: "Won Leads",           value: loading ? "—" : stats.wonLeads,          icon: "🏆", color: "#14a66a" },
                { label: "Active Customers",    value: loading ? "—" : stats.activeCustomers,   icon: "●",  color: "#6857ef" },
                { label: "Total Customers",     value: loading ? "—" : customers.length,        icon: "👥", color: "#ed9828" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#374151", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: item.color }}>{item.icon}</span>
                    {item.label}
                  </span>
                  <strong style={{ fontSize: "14px", color: "#111827" }}>{item.value}</strong>
                </div>
              ))}

            </div>
          </div>

        </section>

        {/* RECENT LEADS */}
        <section className="dashboard-card recent-card">

          <div className="recent-header">
            <div>
              <h3>Recent Leads</h3>
              <p>Your latest sales opportunities</p>
            </div>
            <button
              type="button"
              className="view-all-btn"
              onClick={() => navigate("/leads")}
            >
              View all leads →
            </button>
          </div>

          <div className="leads-table">
            <div className="table-head">
              <span>Name</span>
              <span>Company Name</span>
              <span>Status</span>
              <span>Value</span>
            </div>

            {loading && (
              <div className="leads-empty">
                <div className="lead-loading-spinner" />
                <span>Loading leads...</span>
              </div>
            )}

            {!loading && recentLeads.length === 0 && (
              <div className="leads-empty">
                <div className="empty-icon">◎</div>
                <strong>No leads yet</strong>
                <span>Add your first lead to get started.</span>
              </div>
            )}

            {!loading && recentLeads.map((lead) => (
              <div className="lead-row" key={lead._id}>
                <span>{lead.name  || "—"}</span>
                <span>{lead.company || "—"}</span>
                <span className={`status ${statusClass(lead.status)}`}>
                  {lead.status || "New"}
                </span>
                <span>{formatValue(lead.value)}</span>
              </div>
            ))}

          </div>

        </section>

      </main>

      <AddLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleAddLead}
        showOwner={user.role !== ROLES.SALES_REP}
      />

    </div>
  );
}

export default Dashboard;