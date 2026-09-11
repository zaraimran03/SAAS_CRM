import { useEffect, useMemo, useState } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import { ROLES } from "../config/dashboardConfig";
import "../styles/Dashboard.css";
import "../styles/Reports.css";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/reports/overview`;
const STAGES = ["Qualification", "Proposal", "Negotiation", "Won", "Lost"];
const STAGE_COLORS = { Qualification: "#2878ee", Proposal: "#7346c9", Negotiation: "#c12b68", Won: "#087a52", Lost: "#bd3329" };
const authHeader = () => ({ Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` });

function money(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `$${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `$${(number / 1000).toFixed(1)}K`;
  return `$${number.toLocaleString()}`;
}
function startForRange(range) {
  const start = new Date();
  if (range === "today") start.setHours(0, 0, 0, 0);
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  if (range === "month") start.setDate(1);
  if (range === "quarter") start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  if (range === "year") start.setMonth(0, 1);
  return start;
}
function pct(value, total) { return total ? `${((value / total) * 100).toFixed(1)}%` : "0.0%"; }
function exportCsv(report) {
  const rows = [["Report", "Mini SaaS CRM"], ["Period", `${report.range.start} - ${report.range.end}`], [], ["Metric", "Value"], ["Total Leads", report.kpis.totalLeads], ["Conversion Rate", `${report.kpis.conversionRate}%`], ["Active Deals", report.kpis.activeDeals], ["Won Deals", report.kpis.wonDeals], ["Lost Deals", report.kpis.lostDeals], ["Total Revenue", report.kpis.totalRevenue], [], ["Member", "Leads", "Deals", "Won", "Lost", "Revenue", "Conversion Rate"], ...report.team.map((member) => [member.member, member.leads, member.deals, member.won, member.lost, member.revenue, `${member.conversionRate}%`])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "mini-crm-report.csv"; link.click(); URL.revokeObjectURL(url);
}
function Section({ title, subtitle, children }) { return <section className="dashboard-card rpt-card"><div className="card-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div></div>{children}</section>; }
function Empty({ text = "No data available for this period." }) { return <div className="dash-empty">{text}</div>; }
function BarList({ items, format = (value) => value }) {
  const max = Math.max(...items.map((item) => Number(item.count) || 0), 1);
  return <div className="rpt-bar-list">{items.map((item) => <div className="rpt-bar-item" key={item.label}><div className="rpt-bar-item-head"><span>{item.label}</span><strong>{format(item.count)}</strong></div><div className="rpt-bar-track"><div className="rpt-bar-progress" style={{ width: `${Math.max(0, (item.count / max) * 100)}%`, background: item.color || "#5B4BFF" }} /></div></div>)}</div>;
}

function Reports() {
  const { user, logout } = useAuthUser();
  const role = user?.role || ROLES.ORG_ADMIN;
  const [range, setRange] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [memberFilter, setMemberFilter] = useState("All Members");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const period = useMemo(() => ({ start: range === "custom" && customStart ? new Date(`${customStart}T00:00:00`) : startForRange(range), end: range === "custom" && customEnd ? new Date(`${customEnd}T23:59:59`) : new Date() }), [range, customStart, customEnd]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ start: period.start.toISOString(), end: period.end.toISOString() });
        const response = await fetch(`${API_URL}?${params}`, { headers: authHeader() });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load reports.");
        setReport(data);
      } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
    };
    load();
  }, [user, period]);

  const filtered = useMemo(() => {
    if (!report) return null;
    const deals = report.deals.filter((deal) => (stageFilter === "All Stages" || deal.stage === stageFilter) && (memberFilter === "All Members" || deal.owner === memberFilter));
    const leads = report.leads.filter((lead) => memberFilter === "All Members" || lead.owner === memberFilter);
    const team = report.team.filter((member) => memberFilter === "All Members" || member.member === memberFilter);
    return { ...report, deals, leads, team };
  }, [report, memberFilter, stageFilter]);
  const taskStats = useMemo(() => {
    const tasks = filtered?.tasks || [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return { total: tasks.length, todo: tasks.filter((task) => task.status === "To Do").length, progress: tasks.filter((task) => task.status === "In Progress").length, review: tasks.filter((task) => task.status === "Review").length, done: tasks.filter((task) => task.status === "Done").length, overdue: tasks.filter((task) => task.dueDate && task.status !== "Done" && new Date(`${task.dueDate}T00:00:00`) < today).length };
  }, [filtered]);
  if (!user) return null;

  return <div className="dashboard-page"><Sidebar user={user} role={role} onLogout={logout} /><main className="dashboard-content">
    <header className="dashboard-header"><div><h1>Reports</h1><p>Track sales performance, leads, revenue, and team activity.</p></div><div className="header-actions report-controls"><select className="report-date-select" value={range} onChange={(event) => setRange(event.target.value)}><option value="today">Today</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="month">This Month</option><option value="quarter">This Quarter</option><option value="year">This Year</option><option value="custom">Custom Range</option></select><button type="button" className="add-lead-btn" disabled={!report} onClick={() => exportCsv(report)}>Export Report</button></div></header>
    {range === "custom" && <div className="report-custom-range"><label>From <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label><label>To <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label></div>}
    {error && <div className="lead-message error">{error}</div>}
    <section className="stats-grid reports-kpi-grid">{[["Total Leads", filtered?.kpis.totalLeads, "blue", "◎"], ["Conversion Rate", `${filtered?.kpis.conversionRate || 0}%`, "purple", "%"], ["Active Deals", filtered?.kpis.activeDeals, "orange", "◇"], ["Won Deals", filtered?.kpis.wonDeals, "green", "✓"], ["Lost Deals", filtered?.kpis.lostDeals, "red", "!"], ["Total Revenue", money(filtered?.kpis.totalRevenue), "green", "$" ]].map(([label, value, color, icon]) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><div className={`stat-icon ${color}`}>{icon}</div></div><h2>{loading ? "—" : value}</h2></div>)}</section>
    <div className="report-filter-row"><select className="report-date-select" value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}><option>All Members</option>{(report?.members || []).map((member) => <option key={member._id} value={member.fullName}>{member.fullName}</option>)}</select><select className="report-date-select" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option>All Stages</option>{STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></div>
    {loading ? <div className="dashboard-card rpt-card"><div className="dash-loading">Loading report data...</div></div> : !filtered ? <Empty /> : <div className="report-section-stack">
      <Section title="Revenue Overview" subtitle="Deal value by stage in the selected period"><BarList items={STAGES.map((stage) => ({ label: stage, count: filtered.deals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + Number(String(deal.value || 0).replace(/[$,]/g, "")), 0), color: STAGE_COLORS[stage] }))} format={money} /></Section>
      <div className="report-two-column"><Section title="Lead Analytics" subtitle="Current lead funnel"><div className="rpt-stat-grid">{[["Total Leads", filtered.leads.length], ["New Leads", filtered.leads.filter((lead) => lead.status === "New").length], ["Qualified Leads", filtered.leads.filter((lead) => ["Proposal", "Negotiation"].includes(lead.status)).length], ["Converted Leads", filtered.leads.filter((lead) => lead.status === "Won").length], ["Lost Leads", 0], ["Conversion Rate", pct(filtered.leads.filter((lead) => lead.status === "Won").length, filtered.leads.length)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="rpt-funnel">{["New", "Contacted", "Qualified", "Opportunity", "Converted"].map((stage, index) => <div key={stage} style={{ width: `${100 - index * 15}%` }}>{stage}<strong>{stage === "Qualified" ? filtered.leads.filter((lead) => ["Proposal", "Negotiation"].includes(lead.status)).length : stage === "Opportunity" ? filtered.deals.length : stage === "Converted" ? filtered.leads.filter((lead) => lead.status === "Won").length : filtered.leads.filter((lead) => lead.status === stage).length}</strong></div>)}</div></Section><Section title="Lead Sources" subtitle="Source data is shown when available"><Empty text="No lead source data available." /></Section></div>
      <Section title="Pipeline Performance" subtitle="Deals by stage and total value"><BarList items={STAGES.map((stage) => ({ label: stage, count: filtered.deals.filter((deal) => deal.stage === stage).length, color: STAGE_COLORS[stage] }))} /></Section>
      <Section title="Sales Team Performance" subtitle="Sorted by revenue"><div className="rpt-table rpt-wide-table"><div className="rpt-thead"><span>Member</span><span>Leads</span><span>Deals</span><span>Won</span><span>Lost</span><span>Revenue</span><span>Conversion</span></div>{filtered.team.length ? filtered.team.map((member) => <div className="rpt-trow" key={member.member}><span className="rpt-name">{member.member}</span><span>{member.leads}</span><span>{member.deals}</span><span>{member.won}</span><span>{member.lost}</span><span className="rpt-value">{money(member.revenue)}</span><span>{member.conversionRate}%</span></div>) : <Empty text="No team data available for this period." />}</div></Section>
      <div className="report-two-column"><Section title="Activities Overview"><div className="rpt-stat-grid">{["Call", "Email", "Meeting", "Note", "Follow-up"].map((type) => <div key={type}><span>{type}s</span><strong>{filtered.activities.filter((activity) => activity.type === type).length}</strong></div>)}</div><BarList items={["Call", "Email", "Meeting", "Follow-up"].map((type) => ({ label: type, count: filtered.activities.filter((activity) => activity.type === type).length }))} /></Section><Section title="Task Performance"><div className="rpt-stat-grid">{[["Total Tasks", taskStats.total], ["To Do", taskStats.todo], ["In Progress", taskStats.progress], ["Review", taskStats.review], ["Done", taskStats.done], ["Overdue", taskStats.overdue], ["Completion Rate", pct(taskStats.done, taskStats.total)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><BarList items={["Low", "Medium", "High", "Urgent"].map((priority) => ({ label: priority, count: filtered.tasks.filter((task) => task.priority === priority).length }))} /></Section></div>
      <Section title="Customer Overview"><div className="rpt-stat-grid">{[["Total Customers", filtered.customers.length], ["New Customers", filtered.customers.length], ["Active Customers", filtered.customers.filter((customer) => customer.status === "Active").length], ["Inactive Customers", filtered.customers.filter((customer) => customer.status === "Inactive").length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><BarList items={["Active", "Inactive", "Churned"].map((status) => ({ label: status, count: filtered.customers.filter((customer) => customer.status === status).length }))} /></Section>
    </div>}
  </main></div>;
}

export default Reports;
