import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import { ROLES } from "../config/dashboardConfig";
import "../styles/Dashboard.css";
import "../styles/Reports.css";

const API_BASE      = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LEADS_API     = `${API_BASE}/leads`;
const CUSTOMERS_API = `${API_BASE}/customers`;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMonth(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getMonth();
}

function formatCurrency(n) {
  if (!n) return "$0";
  const num = Number(String(n).replace(/[$,]/g, ""));
  if (isNaN(num)) return "$0";
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

const STAGE_COLORS = {
  New:         "#2878ee",
  Contacted:   "#6857ef",
  Proposal:    "#ed9828",
  Negotiation: "#d946ef",
  Won:         "#14a66a",
};

const STAGE_BG = {
  New:         "#eff6ff",
  Contacted:   "#f5f3ff",
  Proposal:    "#fff7ed",
  Negotiation: "#fdf4ff",
  Won:         "#dcfce7",
};

function StatusBadge({ status }) {
  const map = {
    Won:         { bg: "#dcfce7", color: "#16a34a" },
    New:         { bg: "#eff6ff", color: "#2563eb" },
    Contacted:   { bg: "#f5f3ff", color: "#7c3aed" },
    Proposal:    { bg: "#fff7ed", color: "#ea580c" },
    Negotiation: { bg: "#fdf4ff", color: "#a21caf" },
    Active:      { bg: "#dcfce7", color: "#16a34a" },
    Churned:     { bg: "#fee2e2", color: "#dc2626" },
    Inactive:    { bg: "#f3f4f6", color: "#6b7280" },
  };
  const style = map[status] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      whiteSpace: "nowrap",
    }}>
      {status || "—"}
    </span>
  );
}

function Reports() {
  const { user, logout } = useAuthUser();
  const navigate         = useNavigate();
  const role             = user?.role || ROLES.ORG_ADMIN;

  const [leads,     setLeads]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("leads");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [lRes, cRes] = await Promise.all([fetch(LEADS_API), fetch(CUSTOMERS_API)]);
        const ld = await lRes.json().catch(() => ({}));
        const cd = await cRes.json().catch(() => ({}));
        setLeads(Array.isArray(ld.leads)         ? ld.leads         : []);
        setCustomers(Array.isArray(cd.customers) ? cd.customers     : []);
      } catch {
        setLeads([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const cutoff = useMemo(() => {
    if (dateRange === "all") return null;
    const d = new Date();
    d.setDate(d.getDate() - Number(dateRange));
    return d;
  }, [dateRange]);

  const filteredLeads = useMemo(() => {
    if (!cutoff) return leads;
    return leads.filter(l => { const d = new Date(l.createdAt || l.date); return !isNaN(d) && d >= cutoff; });
  }, [leads, cutoff]);

  const filteredCustomers = useMemo(() => {
    if (!cutoff) return customers;
    return customers.filter(c => { const d = new Date(c.createdAt || c.date); return !isNaN(d) && d >= cutoff; });
  }, [customers, cutoff]);

  const kpis = useMemo(() => {
    const totalLeads      = filteredLeads.length;
    const wonLeads        = filteredLeads.filter(l => l.status === "Won").length;
    const winRate         = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";
    const totalRevenue    = filteredLeads.filter(l => l.status === "Won").reduce((s, l) => {
      const v = Number(String(l.value || 0).replace(/[$,]/g, ""));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    const activeCustomers = filteredCustomers.filter(c => c.status === "Active").length;
    const totalCustomers  = filteredCustomers.length;
    return { totalLeads, wonLeads, winRate, totalRevenue, activeCustomers, totalCustomers };
  }, [filteredLeads, filteredCustomers]);

  const STAGES = ["New", "Contacted", "Proposal", "Negotiation", "Won"];

  const pipelineData = useMemo(() => {
    const total = filteredLeads.length || 1;
    return STAGES.map(stage => {
      const count = filteredLeads.filter(l => l.status === stage).length;
      return { stage, count, pct: Math.round((count / total) * 100) };
    });
  }, [filteredLeads]);

  const monthlyLeads = useMemo(() => {
    const buckets = Array(12).fill(0);
    filteredLeads.forEach(l => { const m = getMonth(l.createdAt || l.date); if (m !== null) buckets[m]++; });
    const max = Math.max(...buckets, 1);
    return buckets.map((count, i) => ({ month: MONTHS[i], count, pct: Math.round((count / max) * 100) }));
  }, [filteredLeads]);

  const customerStatusData = useMemo(() => {
    const map = {};
    filteredCustomers.forEach(c => { const s = c.status || "Unknown"; map[s] = (map[s] || 0) + 1; });
    const total = filteredCustomers.length || 1;
    return Object.entries(map).map(([status, count]) => ({ status, count, pct: Math.round((count / total) * 100) }));
  }, [filteredCustomers]);

  const topLeads = useMemo(() =>
    [...filteredLeads]
      .filter(l => l.value)
      .sort((a, b) => {
        const va = Number(String(a.value).replace(/[$,]/g, ""));
        const vb = Number(String(b.value).replace(/[$,]/g, ""));
        return vb - va;
      })
      .slice(0, 10),
  [filteredLeads]);

  if (!user) return null;

  const dateOptions = [
    { value: "30",  label: "Last 30 days" },
    { value: "90",  label: "Last 90 days" },
    { value: "365", label: "Last year"    },
    { value: "all", label: "All time"     },
  ];

  const KPI_CARDS = [
    { label: "Total Leads",      value: loading ? "—" : kpis.totalLeads,                  icon: "◎", color: "blue"   },
    { label: "Won Leads",        value: loading ? "—" : kpis.wonLeads,                     icon: "🏆", color: "green"  },
    { label: "Win Rate",         value: loading ? "—" : `${kpis.winRate}%`,                icon: "%",  color: "orange" },
    { label: "Won Revenue",      value: loading ? "—" : formatCurrency(kpis.totalRevenue), icon: "$",  color: "purple" },
    { label: "Active Customers", value: loading ? "—" : kpis.activeCustomers,              icon: "●",  color: "blue"   },
    { label: "Total Customers",  value: loading ? "—" : kpis.totalCustomers,               icon: "👥", color: "green"  },
  ];

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />

      <main className="dashboard-content">

        {/* ── HEADER ── */}
        <header className="dashboard-header">
          <div>
            <h1>Reports</h1>
            <p>Analytics and insights across your CRM data.</p>
          </div>
          <div className="header-actions">
            <select className="report-date-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
              {dateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </header>

        {/* ── KPI CARDS ── */}
        <section className="stats-grid reports-kpi-grid">
          {KPI_CARDS.map(card => (
            <div className="stat-card" key={card.label}>
              <div className="stat-top">
                <span>{card.label}</span>
                <div className={`stat-icon ${card.color}`}>{card.icon}</div>
              </div>
              <h2>{card.value}</h2>
            </div>
          ))}
        </section>

        {/* ── TABS ── */}
        <div className="report-tabs">
          {[
            { key: "leads",     label: "Leads"     },
            { key: "pipeline",  label: "Pipeline"  },
            { key: "customers", label: "Customers" },
          ].map(t => (
            <button
              key={t.key}
              className={`report-tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════
            TAB: LEADS
        ════════════════════════════════════ */}
        {activeTab === "leads" && (
          <div className="report-section-stack">

            {/* Monthly bar chart – full width */}
            <div className="dashboard-card rpt-card">
              <div className="card-heading">
                <div>
                  <h3>Leads Added by Month</h3>
                  <p>Monthly distribution across the year</p>
                </div>
              </div>
              {loading ? (
                <div className="dash-loading">Loading chart…</div>
              ) : filteredLeads.length === 0 ? (
                <div className="dash-empty">No leads in this period.</div>
              ) : (
                <div className="rpt-bar-chart">
                  {monthlyLeads.map(({ month, count, pct }) => (
                    <div className="rpt-bar-col" key={month}>
                      <span className="rpt-bar-num">{count > 0 ? count : ""}</span>
                      <div className="rpt-bar-wrap">
                        <div
                          className="rpt-bar-fill"
                          style={{ height: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                          title={`${month}: ${count} leads`}
                        />
                      </div>
                      <span className="rpt-bar-label">{month}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top leads table – full width */}
            <div className="dashboard-card rpt-card">
              <div className="card-heading">
                <div>
                  <h3>Top Leads by Value</h3>
                  <p>Highest-value opportunities sorted by deal size</p>
                </div>
              </div>
              <div className="rpt-table">
                <div className="rpt-thead">
                  <span>#</span>
                  <span>Name</span>
                  <span>Company</span>
                  <span>Status</span>
                  <span>Value</span>
                </div>
                {loading ? (
                  <div className="dash-loading">Loading…</div>
                ) : topLeads.length === 0 ? (
                  <div className="dash-empty">No leads with deal values yet.</div>
                ) : (
                  topLeads.map((l, i) => (
                    <div className="rpt-trow" key={l._id || i}>
                      <span className="rpt-rank">#{i + 1}</span>
                      <span className="rpt-name">{l.name || "—"}</span>
                      <span className="rpt-muted">{l.company || "—"}</span>
                      <span><StatusBadge status={l.status} /></span>
                      <span className="rpt-value">{formatCurrency(l.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════
            TAB: PIPELINE
        ════════════════════════════════════ */}
        {activeTab === "pipeline" && (
          <div className="report-section-stack">

            <div className="dashboard-card rpt-card">
              <div className="card-heading">
                <div>
                  <h3>Pipeline by Stage</h3>
                  <p>{loading ? "—" : `${filteredLeads.length} total lead${filteredLeads.length !== 1 ? "s" : ""} across all stages`}</p>
                </div>
              </div>

              {loading ? (
                <div className="dash-loading">Loading…</div>
              ) : filteredLeads.length === 0 ? (
                <div className="dash-empty">
                  <span>No leads yet.</span>
                  <button className="add-lead-btn" style={{ marginTop: "12px" }} onClick={() => navigate("/leads")}>
                    + Add your first lead
                  </button>
                </div>
              ) : (
                <>
                  <div className="rpt-pipeline">
                    {pipelineData.map(({ stage, count, pct }) => (
                      <div className="rpt-pipeline-row" key={stage}>
                        <div className="rpt-pipeline-label">
                          <span className="rpt-dot" style={{ background: STAGE_COLORS[stage] }} />
                          <span>{stage}</span>
                        </div>
                        <div className="rpt-pipeline-track">
                          <div
                            className="rpt-pipeline-fill"
                            style={{ width: `${pct}%`, background: STAGE_COLORS[stage] }}
                          />
                        </div>
                        <span className="rpt-pipeline-count">{count}</span>
                        <span className="rpt-pipeline-pct">{pct}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary tiles */}
                  <div className="rpt-stage-tiles">
                    {pipelineData.map(({ stage, count, pct }) => (
                      <div
                        className="rpt-stage-tile"
                        key={stage}
                        style={{ borderTop: `3px solid ${STAGE_COLORS[stage]}`, background: STAGE_BG[stage] }}
                      >
                        <span className="rpt-tile-stage">{stage}</span>
                        <strong className="rpt-tile-count" style={{ color: STAGE_COLORS[stage] }}>{count}</strong>
                        <span className="rpt-tile-pct">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        {/* ════════════════════════════════════
            TAB: CUSTOMERS
        ════════════════════════════════════ */}
        {activeTab === "customers" && (
          <div className="report-section-stack">

            {/* Customer status chart – full width */}
            <div className="dashboard-card rpt-card">
              <div className="card-heading">
                <div>
                  <h3>Customers by Status</h3>
                  <p>Breakdown of your entire customer base</p>
                </div>
              </div>
              {loading ? (
                <div className="dash-loading">Loading…</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="dash-empty">No customers found.</div>
              ) : (
                <div className="rpt-horiz-chart">
                  {customerStatusData.map(({ status, count, pct }) => (
                    <div className="rpt-horiz-row" key={status}>
                      <span className="rpt-horiz-label">{status}</span>
                      <div className="rpt-horiz-track">
                        <div className="rpt-horiz-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="rpt-horiz-count">{count}</span>
                      <span className="rpt-horiz-pct">{pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer records table – full width */}
            <div className="dashboard-card rpt-card">
              <div className="card-heading">
                <div>
                  <h3>Customer Records</h3>
                  <p>All customers in this period</p>
                </div>
              </div>
              <div className="rpt-table">
                <div className="rpt-thead rpt-thead-3">
                  <span>Name</span>
                  <span>Company</span>
                  <span>Status</span>
                </div>
                {loading ? (
                  <div className="dash-loading">Loading…</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="dash-empty">No customers yet.</div>
                ) : (
                  filteredCustomers.slice(0, 10).map((c, i) => (
                    <div className="rpt-trow rpt-trow-3" key={c._id || i}>
                      <span className="rpt-name">{c.name || "—"}</span>
                      <span className="rpt-muted">{c.company || "—"}</span>
                      <span><StatusBadge status={c.status} /></span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default Reports;
