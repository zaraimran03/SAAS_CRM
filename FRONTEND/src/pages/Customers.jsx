import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";

import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddCustomerModal from "../components/AddCustomerModal";
import AddPurchaseModal from "../components/AddPurchaseModal";

import { ROLES } from "../config/dashboardConfig";
import {
  CUSTOMERS_COPY,
  CUSTOMER_FILTERS,
  statusClass,
} from "../config/customersConfig";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/customers`
  : "http://localhost:5000/customers";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

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
  const [purchaseCustomer, setPurchaseCustomer] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

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

      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
      });
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
    return { total, active, inactive };
  }, [rows]);

  if (!user) return null;
  if (!copy) return <Navigate to="/dashboard" replace />;

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setError("");
    setIsModalOpen(true);
  };

  const handleActionToggle = (customerId, event) => {
    if (openActionMenu === customerId) {
      setOpenActionMenu(null);
      setActionMenuPosition(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const menuHeight = 132;
    const menuWidth = 130;
    const gap = 6;
    const openAbove = bounds.top >= menuHeight + gap;

    setActionMenuPosition({
      top: openAbove ? bounds.top - menuHeight - gap : bounds.bottom + gap,
      left: Math.max(8, bounds.right - menuWidth),
    });
    setOpenActionMenu(customerId);
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

  const handleAddPurchase = async (purchase) => {
    if (!purchaseCustomer?._id) return;

    try {
      let updatedCustomer = purchaseCustomer;
      for (const item of purchase) {
        const response = await fetch(`${API_URL}/${purchaseCustomer._id}/purchases`, {
          method: "POST",
          headers: authHeader(),
          body: JSON.stringify(item),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to add purchase");
        updatedCustomer = data.customer;
      }

      setRows((previousRows) => previousRows.map((customer) => (
        customer._id === purchaseCustomer._id ? updatedCustomer : customer
      )));
      setPurchaseCustomer(null);
      showMessage("Purchase added successfully!", "success");
    } catch (err) {
      showMessage(err.message || "Failed to add purchase.", "error");
      throw err;
    }
  };

  const handleSubmitCustomer = async (customerData) => {
    const isEditing = Boolean(editingCustomer?._id);
    try {
      setError("");
      const url = isEditing ? `${API_URL}/${editingCustomer._id}` : API_URL;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: authHeader(),
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
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` },
      });
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

          <div className="leads-table full-leads-table customer-table" data-with-owner={copy.showOwner}>
            <div className="table-head">
              <span>Name</span>
              <span>Company Name</span>
              <span>Email</span>
              {copy.showOwner && <span>Owner</span>}
              <span>Status</span>
              <span>Balance</span>
              <span>Due Date</span>
              <span>Last Contacted</span>
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
              <div 
                className="lead-row" 
                key={customer._id} 
              >
                <span className="lead-name">{customer.name || "-"}</span>
                <span>{customer.company || "-"}</span>
                <span>{customer.email || "-"}</span>
                {copy.showOwner && <span>{customer.owner || "-"}</span>}
                <span className={`status ${statusClass(customer.status)}`}>
                  {(customer.status || "Active") === "Inactive" ? "INACTIVE" : customer.status || "Active"}
                </span>
                <span className="lead-value">${Number(customer.balance || 0).toLocaleString()}</span>
                <span className="lead-date">{customer.dueDate ? new Date(customer.dueDate).toLocaleDateString() : "-"}</span>
                <span className="lead-date">{customer.lastContacted ? new Date(customer.lastContacted).toLocaleDateString() : "-"}</span>
                <div className="customer-action-menu" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="customer-action-trigger"
                    aria-label={`Actions for ${customer.name || "customer"}`}
                    aria-expanded={openActionMenu === customer._id}
                    onClick={(event) => handleActionToggle(customer._id, event)}
                  >
                    ⋮
                  </button>
                  {openActionMenu === customer._id && (
                    <div
                      className="customer-action-dropdown"
                      style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}
                    >
                      <button type="button" onClick={() => { setPurchaseCustomer(customer); setOpenActionMenu(null); }}>
                        <span className="customer-action-icon">＋</span>
                        Purchased
                      </button>
                      <button type="button" onClick={() => { handleEdit(customer); setOpenActionMenu(null); }}>
                        <svg className="customer-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => { handleDelete(customer._id); setOpenActionMenu(null); }}>
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
      <AddPurchaseModal
        isOpen={Boolean(purchaseCustomer)}
        onClose={() => setPurchaseCustomer(null)}
        onSubmit={handleAddPurchase}
        existingPurchases={purchaseCustomer?.purchases || []}
      />
    </div>
  );
}

export default Customers;
