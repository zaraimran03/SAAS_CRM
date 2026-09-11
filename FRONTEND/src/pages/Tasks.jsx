import { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";
import "../styles/Tasks.css";

import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddTaskModal from "../components/AddTaskModal";
import { ROLES } from "../config/dashboardConfig";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/tasks`
  : "http://localhost:5000/tasks";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

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
          (t.relatedTo && t.relatedTo.toLowerCase().includes(s)) ||
          (t.assignee && t.assignee.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [tasks, activeFilter, search]);
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "proposal-status";
    case "Urgent":
      return "lost-status overdue-status";
    case "Medium":
      return "contacted-status";
    case "Low":
    default:
      return "new-status";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Done":
      return "won-status";
    case "Review":
      return "proposal-status";
    case "In Progress":
      return "contacted-status";
    case "To Do":
    case "Cancelled":
    default:
      return status === "Cancelled" ? "lost-status" : "new-status";
  }
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "Done") return false;
  const due = new Date(`${task.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(due.getTime()) && due < today;
}

function formatDate(date) {
  if (!date) return "-";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTasks();
    else setLoading(false);
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

  const handleSubmitTask = async (taskData) => {
    try {
      const res = await fetch(
        editingTask ? `${API_URL}/${editingTask._id}` : API_URL,
        {
          method: editingTask ? "PUT" : "POST",
          headers: authHeader(),
          body: JSON.stringify(taskData),
        }
      );
      const data = await res.json();
      if (data.success) {
        setTasks((currentTasks) =>
          editingTask
            ? currentTasks.map((task) => task._id === editingTask._id ? data.task : task)
            : [data.task, ...currentTasks]
        );
      }
    } catch (err) {
      console.error("Failed to save task", err);
    }
    handleCloseAdd();
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (!id) return;
    fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTasks((currentTasks) => currentTasks.filter((task) => task._id !== id));
        }
      })
      .catch((err) => console.error("Failed to delete task", err));
  };

  const handleMarkDone = async (task) => {
    const res = await fetch(`${API_URL}/${task._id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify({ status: "Done" }),
    });
    const data = await res.json();
    if (data.success) setTasks((current) => current.map((item) => item._id === task._id ? data.task : item));
  };

  const handleView = (task) => {
    window.alert(`${task.title}\n\n${task.description || "No description"}\nRelated to: ${task.relatedTo || "-"}`);
  };

  const handleActionToggle = (taskId, event) => {
    if (openActionMenu === taskId) {
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
    setOpenActionMenu(taskId);
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

          <div className="leads-table full-leads-table task-table" data-with-owner="true">
            <div className="table-head">
              <span>Task Title</span>
              <span>Related To</span>
              <span>Assignee</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Due Date</span>
              <span>Actions</span>
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
                <div className="lead-row" key={t._id}>
                  <span className="lead-name">{t.title}</span>
                  <span>{t.relatedTo || "-"}</span>
                  <span>{t.assignee || "Unassigned"}</span>
                  <span className={`status ${getPriorityClass(t.priority)}`}>
                    {t.priority}
                  </span>
                  <span className={`status ${getStatusClass(t.status)}`}>
                    {t.status}
                  </span>
                  <span className={isOverdue(t) ? "lead-value overdue-status" : "lead-value"}>
                    {isOverdue(t) ? `Overdue · ${formatDate(t.dueDate)}` : formatDate(t.dueDate)}
                  </span>
                  <div className="lead-actions lead-actions-menu" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="customer-action-trigger"
                      aria-label={`Actions for ${t.title || "task"}`}
                      aria-expanded={openActionMenu === t._id}
                      onClick={(event) => handleActionToggle(t._id, event)}
                    >
                      ⋮
                    </button>
                    {openActionMenu === t._id && (
                      <div className="customer-action-dropdown" style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}>
                        <button type="button" onClick={() => { handleView(t); setOpenActionMenu(null); }}>View</button>
                          <button type="button" onClick={() => { handleEdit(t); setOpenActionMenu(null); }}>
                          <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          Edit
                        </button>
                        {t.status !== "Done" && <button type="button" onClick={() => { handleMarkDone(t); setOpenActionMenu(null); }}>Mark as Done</button>}
                        <button type="button" className="danger" onClick={() => { handleDelete(t._id); setOpenActionMenu(null); }}>
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
                      onClick={() => handleEdit(t)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"4px",verticalAlign:"middle"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      type="button"
                      className="delete-lead-btn"
                      onClick={() => handleDelete(t._id)}
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
