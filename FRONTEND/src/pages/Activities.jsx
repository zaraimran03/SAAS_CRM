import { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddActivityModal from "../components/AddActivityModal";
import { ROLES } from "../config/dashboardConfig";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/activities`
  : "http://localhost:5000/activities";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

function useVisibleActivities(activities, activeFilter, search) {
  return useMemo(() => {
    let filtered = activities;
    if (activeFilter !== "All") {
      filtered = filtered.filter((a) => a.type === activeFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.contact && a.contact.toLowerCase().includes(s)) ||
          (a.title && a.title.toLowerCase().includes(s)) ||
          (a.relatedTo && a.relatedTo.toLowerCase().includes(s)) ||
          (a.notes && a.notes.toLowerCase().includes(s)) ||
          (a.owner && a.owner.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [activities, activeFilter, search]);
}

function getTypeClass(type) {
  switch (type) {
    case "Meeting":
      return "won-status";
    case "Call":
      return "new-status";
    case "Follow-up":
      return "contacted-status";
    case "Note":
      return "inactive-status";
    case "Email":
    default:
      return "proposal-status";
  }
}

function Activities() {
  const { user, logout } = useAuthUser();
  const role = user?.role || ROLES.ORG_ADMIN;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, { headers: authHeader() });
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error("Failed to fetch activities", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
    } else {
      setLoading(false);
    }
  }, [user]);

  const filteredActivities = useVisibleActivities(activities, activeFilter, search);

  const stats = useMemo(() => {
    const total = activities.length;
    const calls = activities.filter((a) => a.type === "Call").length;
    const emails = activities.filter((a) => a.type === "Email").length;
    const meetings = activities.filter((a) => a.type === "Meeting").length;
    return { total, calls, emails, meetings };
  }, [activities]);

  if (!user) return null;

  const handleOpenAdd = () => {
    setIsModalOpen(true);
    setEditingActivity(null);
  };
  
  const handleCloseAdd = () => {
    setIsModalOpen(false);
    setEditingActivity(null);
  };

  const handleSubmitActivity = async (activityData) => {
    try {
      if (editingActivity) {
        // Update
        const res = await fetch(`${API_URL}/${editingActivity._id}`, {
          method: "PUT",
          headers: authHeader(),
          body: JSON.stringify(activityData),
        });
        const data = await res.json();
        if (data.success) {
          setActivities(activities.map(a => a._id === editingActivity._id ? data.activity : a));
        }
      } else {
        // Create
        const res = await fetch(API_URL, {
          method: "POST",
          headers: authHeader(),
          body: JSON.stringify(activityData),
        });
        const data = await res.json();
        if (data.success) {
          setActivities([data.activity, ...activities]);
        }
      }
      handleCloseAdd();
    } catch (err) {
      console.error("Failed to save activity", err);
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setActivities(activities.filter(a => a._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete activity", err);
    }
  };

  const handleView = (activity) => {
    window.alert(`${activity.title || activity.notes || "Activity"}\n\nRelated to: ${activity.relatedTo || activity.contact || "-"}\nType: ${activity.type}`);
  };

  const handleActionToggle = (activityId, event) => {
    if (openActionMenu === activityId) {
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
    setOpenActionMenu(activityId);
  };

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Activities</h1>
            <p>Log and track all customer interactions.</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="add-lead-btn" onClick={handleOpenAdd}>
              + Log Activity
            </button>
          </div>
        </header>

        <section className="stats-grid leads-stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total Logged</span>
              <div className="stat-icon purple">◷</div>
            </div>
            <h2>{stats.total}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Calls</span>
              <div className="stat-icon orange">📞</div>
            </div>
            <h2>{stats.calls}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Emails</span>
              <div className="stat-icon blue">✉</div>
            </div>
            <h2>{stats.emails}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Meetings</span>
              <div className="stat-icon green">🤝</div>
            </div>
            <h2>{stats.meetings}</h2>
          </div>
        </section>

        <section className="dashboard-card leads-table-card">
          <div className="leads-filter-bar">
            {["All", "Call", "Email", "Meeting", "Note", "Follow-up"].map((tab) => (
              <button
                key={tab}
                className={`filter-chip ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="leads-table full-leads-table activity-table" data-with-owner="true">
            <div className="table-head">
              <span>Activity</span>
              <span>Related To</span>
              <span>Owner</span>
              <span>Type</span>
              <span>Date</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="leads-empty">
                <div className="lead-loading-spinner" />
                <span>Loading activities...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="leads-empty">
                <div className="empty-icon">◷</div>
                <strong>No activities found</strong>
                <span>Try adjusting your search or filters.</span>
              </div>
            ) : (
              filteredActivities.map((a) => (
                <div className="lead-row" key={a._id}>
                  <span className="lead-name">{a.title || a.notes || "Activity"}</span>
                  <span>{a.relatedTo || a.contact || "-"}</span>
                  <span>{a.owner || "Unassigned"}</span>
                  <span className={`status ${getTypeClass(a.type)}`}>
                    {a.type}
                  </span>
                  <span className="lead-value">{a.date || "-"}</span>
                  <div className="lead-actions lead-actions-menu" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="customer-action-trigger"
                      aria-label={`Actions for ${a.title || a.contact || "activity"}`}
                      aria-expanded={openActionMenu === a._id}
                      onClick={(event) => handleActionToggle(a._id, event)}
                    >
                      ⋮
                    </button>
                    {openActionMenu === a._id && (
                      <div className="customer-action-dropdown" style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}>
                        <button type="button" onClick={() => { handleView(a); setOpenActionMenu(null); }}>View</button>
                        <button type="button" onClick={() => { handleEdit(a); setOpenActionMenu(null); }}>
                          <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                          Edit
                        </button>
                        <button type="button" className="danger" onClick={() => { handleDelete(a._id); setOpenActionMenu(null); }}>
                          <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
                          Delete
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="edit-lead-btn"
                      onClick={() => handleEdit(a)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px",verticalAlign:"middle"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      type="button"
                      className="delete-lead-btn"
                      onClick={() => handleDelete(a._id)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px",verticalAlign:"middle"}}><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <AddActivityModal
        isOpen={isModalOpen}
        onClose={handleCloseAdd}
        onSubmit={handleSubmitActivity}
        showOwner={user.role !== ROLES.SALES_REP}
        activityToEdit={editingActivity}
      />
    </div>
  );
}

export default Activities;
