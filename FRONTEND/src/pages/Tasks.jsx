import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";
import "../styles/Tasks.css";

import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddTaskModal from "../components/AddTaskModal";
import { ROLES } from "../config/dashboardConfig";

// Dummy data for tasks (using let so it persists in-memory across client-side navigation)
let DUMMY_TASKS = [];

function useVisibleTasks(tasks, activeFilter, search) {
  return useMemo(() => {
    let filtered = tasks;
    if (activeFilter !== "All") {
      filtered = filtered.filter((t) => t.status === activeFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(s)) ||
          (t.description && t.description.toLowerCase().includes(s)) ||
          (t.assignee && t.assignee.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [tasks, activeFilter, search]);
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "status-churned"; // re-using red/orange style from leads
    case "Medium":
      return "status-proposal"; // re-using yellow style
    case "Low":
    default:
      return "status-contacted"; // re-using blue style
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Done":
      return "status-active"; // green
    case "Review":
      return "status-proposal"; // yellow
    case "In Progress":
      return "status-contacted"; // blue
    case "To Do":
    default:
      return "status-new"; // gray/purple
  }
}

function Tasks() {
  const { user, logout } = useAuthUser();
  const role = user?.role || ROLES.ORG_ADMIN;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load dummy data on mount
  useEffect(() => {
    if (user) {
      // Placeholder for real API call – no data
      setTasks([]);
    }
    setLoading(false);
  }, [user]);

  const filteredTasks = useVisibleTasks(tasks, activeFilter, search);

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "To Do").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const done = tasks.filter((t) => t.status === "Done").length;
    return { total, todo, inProgress, done };
  }, [tasks]);

  if (!user) return null;

  const handleOpenAdd = () => {
    setIsModalOpen(true);
    setEditingTask(null);
  };
  
  const handleCloseAdd = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmitTask = (taskData) => {
    if (editingTask) {
      const updated = { ...taskData, id: editingTask.id };
      const newTasks = tasks.map(t => t.id === editingTask.id ? updated : t);
      setTasks(newTasks);
      DUMMY_TASKS = newTasks;
    } else {
      const created = { ...taskData, id: Date.now() };
      const newTasks = [created, ...tasks];
      setTasks(newTasks);
      DUMMY_TASKS = newTasks;
    }
    handleCloseAdd();
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!id) return;
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    DUMMY_TASKS = newTasks;
  };

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />
      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Tasks</h1>
            <p>Manage your team's tasks and priorities.</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="add-lead-btn" onClick={handleOpenAdd}>
              + Create Task
            </button>
          </div>
        </header>

        <section className="stats-grid leads-stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total Tasks</span>
              <div className="stat-icon purple">✓</div>
            </div>
            <h2>{stats.total}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>To Do</span>
              <div className="stat-icon blue">☐</div>
            </div>
            <h2>{stats.todo}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>In Progress</span>
              <div className="stat-icon orange">↻</div>
            </div>
            <h2>{stats.inProgress}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Done</span>
              <div className="stat-icon green">★</div>
            </div>
            <h2>{stats.done}</h2>
          </div>
        </section>

        <section className="dashboard-card leads-table-card">
          <div className="leads-filter-bar">
            {["All", "To Do", "In Progress", "Review", "Done"].map((tab) => (
              <button
                key={tab}
                className={`filter-chip ${activeFilter === tab ? "active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="leads-table full-leads-table" data-with-owner="true">
            <div className="table-head">
              <span>Task Title</span>
              <span className="hide-on-tablet">Description</span>
              <span>Assignee</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Due Date</span>
              <span></span>
            </div>

            {loading ? (
              <div className="leads-empty">
                <div className="lead-loading-spinner" />
                <span>Loading tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="leads-empty">
                <div className="empty-icon">✓</div>
                <strong>No tasks found</strong>
                <span>Try adjusting your search or filters.</span>
              </div>
            ) : (
              filteredTasks.map((t) => (
                <div className="lead-row" key={t.id}>
                  <span className="lead-name">{t.title}</span>
                  <span className="hide-on-tablet">{t.description || "-"}</span>
                  <span>{t.assignee || "Unassigned"}</span>
                  <span className={`status ${getPriorityClass(t.priority)}`}>
                    {t.priority}
                  </span>
                  <span className={`status ${getStatusClass(t.status)}`}>
                    {t.status}
                  </span>
                  <span className="lead-value">{t.dueDate || "-"}</span>
                  <div className="lead-actions">
                    <button
                      type="button"
                      className="edit-lead-btn"
                      onClick={() => handleEdit(t)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px",verticalAlign:"middle"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      type="button"
                      className="delete-lead-btn"
                      onClick={() => handleDelete(t.id)}
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

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseAdd}
        onSubmit={handleSubmitTask}
        showAssignee={user.role !== ROLES.SALES_REP}
        taskToEdit={editingTask}
      />
    </div>
  );
}

export default Tasks;
