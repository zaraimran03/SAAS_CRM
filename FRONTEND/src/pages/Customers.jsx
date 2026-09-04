import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";

import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddCustomerModal from "../components/AddCustomerModal";

import { ROLES } from "../config/dashboardConfig";
import {
  CUSTOMERS_COPY,
  CUSTOMER_FILTERS,
  statusClass,
} from "../config/customersConfig";

<<<<<<< HEAD
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/customers`
  : "http://localhost:5000/customers";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});
=======
const API_URL = "http://localhost:5000/customers";
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146

function useVisibleRows(rows, activeFilter, search) {
  return useMemo(() => {
    let filtered = rows;
    if (activeFilter !== "All") {
      filtered = filtered.filter((r) => r.status === activeFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(s)) ||
          (r.company && r.company.toLowerCase().includes(s)) ||
          (r.email && r.email.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [rows, activeFilter, search]);
}

function Customers() {
  const { user, logout } = useAuthUser();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const role = user?.role || ROLES.ORG_ADMIN;
  const copy = CUSTOMERS_COPY[role];

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

<<<<<<< HEAD
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
      });
=======
      const response = await fetch(API_URL);
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to fetch customers");
      setRows(Array.isArray(data.customers) ? data.customers : []);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCustomers();
    else setLoading(false);
  }, [user]);

  const filteredRows = useVisibleRows(rows, activeFilter, search);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === "Active").length;
    const inactive = rows.filter((r) => r.status === "Inactive").length;
    const churned = rows.filter((r) => r.status === "Churned").length;
    return { total, active, inactive, churned };
  }, [rows]);

  if (!user) return null;
  if (!copy) return <Navigate to="/dashboard" replace />;

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setError("");
    setIsModalOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmitCustomer = async (customerData) => {
    const isEditing = Boolean(editingCustomer?._id);
    try {
      setError("");
      const url = isEditing ? `${API_URL}/${editingCustomer._id}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
<<<<<<< HEAD
        headers: authHeader(),
=======
        headers: { "Content-Type": "application/json" },
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || `Failed to ${isEditing ? "update" : "create"} customer`);

      if (!isEditing) {
        if (data.customer) setRows((prev) => [data.customer, ...prev]);
        else await fetchCustomers();
        showMessage("Customer added successfully!", "success");
      } else {
        if (data.customer) {
          setRows((prev) => prev.map((c) => (c._id === editingCustomer._id ? data.customer : c)));
        } else {
          await fetchCustomers();
        }
        showMessage("Customer updated successfully!", "success");
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      showMessage(err.message || "Failed to save customer.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      setError("");
<<<<<<< HEAD
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
      });
=======
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to delete customer");

      setRows((prev) => prev.filter((c) => c._id !== id));
      showMessage("Customer deleted successfully!", "success");
    } catch (err) {
      showMessage(err.message || "Failed to delete customer.", "error");
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "$0";
    const cleanValue = String(value).replace("$", "").replace(/,/g, "");
    const numberValue = Number(cleanValue);
    if (Number.isNaN(numberValue)) return value;
    return `$${numberValue.toLocaleString()}`;
  };

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />
      <main className="dashboard-content">
        {message && (
          <div className={`lead-message ${messageType === "success" ? "success" : "error"}`}>
            <span className="lead-message-icon">{messageType === "success" ? "✓" : "!"}</span>
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>×</button>
          </div>
        )}

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
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="add-lead-btn" onClick={handleOpenAdd}>
              {copy.addButtonLabel}
            </button>
          </div>
        </header>

        <section className="stats-grid leads-stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total Customers</span>
              <div className="stat-icon blue">👥</div>
            </div>
            <h2>{stats.total}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Active</span>
              <div className="stat-icon green">✨</div>
            </div>
            <h2>{stats.active}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Inactive</span>
              <div className="stat-icon orange">📞</div>
            </div>
            <h2>{stats.inactive}</h2>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Churned</span>
              <div className="stat-icon purple">🏆</div>
            </div>
            <h2>{stats.churned}</h2>
          </div>
        </section>

        <section className="dashboard-card leads-table-card">
          <div className="leads-filter-bar">
            {CUSTOMER_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter}
                className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {error && <div className="leads-error">{error}</div>}

          <div className="leads-table full-leads-table" data-with-owner={copy.showOwner}>
            <div className="table-head">
              <span>Name</span>
              <span>Company</span>
              <span>Email</span>
              {copy.showOwner && <span>Owner</span>}
              <span>Status</span>
              <span>Value</span>
<<<<<<< HEAD
              <span>Due Date</span>
=======
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
              <span>Actions</span>
            </div>

            {loading && (
              <div className="leads-empty">
                <div className="lead-loading-spinner" />
                <span>Loading customers...</span>
              </div>
            )}

            {!loading && filteredRows.length === 0 && (
              <div className="leads-empty">
                <div className="empty-icon">👥</div>
                <strong>No customers found</strong>
                <span>
                  {search || activeFilter !== "All"
                    ? "Try changing your search or filter. "
                    : "Add your first customer to get started."}
                </span>
              </div>
            )}

            {!loading && filteredRows.map((customer) => (
              <div className="lead-row" key={customer._id}>
                <span className="lead-name">{customer.name || "-"}</span>
                <span>{customer.company || "-"}</span>
                <span>{customer.email || "-"}</span>
                {copy.showOwner && <span>{customer.owner || "-"}</span>}
                <span className={`status ${statusClass(customer.status)}`}>
                  {customer.status || "Active"}
                </span>
                <span className="lead-value">{formatValue(customer.value)}</span>
<<<<<<< HEAD
                <span className="lead-date">{customer.dueDate ? new Date(customer.dueDate).toLocaleDateString() : "-"}</span>
=======
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
                <div className="lead-actions">
                  <button type="button" className="edit-lead-btn" onClick={() => handleEdit(customer)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"0",verticalAlign:"middle"}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button type="button" className="delete-lead-btn" onClick={() => handleDelete(customer._id)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"0",verticalAlign:"middle"}}><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCustomer}
        showOwner={copy.showOwner}
        editingCustomer={editingCustomer}
      />
    </div>
  );
}

export default Customers;
