import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";
import "../styles/Members.css";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddMemberModal from "../components/AddMemberModal";
import { ROLES } from "../config/dashboardConfig";

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/users` : "http://localhost:5000/users";
const MANAGEMENT_ROLES = [ROLES.ORG_ADMIN, ROLES.SALES_MANAGER];
const ROLE_LABELS = { org_admin: "Admin", sales_manager: "Manager", sales_rep: "Sales Member", viewer: "Viewer" };
const authHeader = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` });

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "U";
}
function statusClass(status) {
  return status === "Active" ? "won-status" : status === "Pending" ? "proposal-status" : "inactive-status";
}
function roleClass(role) {
  return role === "org_admin" ? "won-status" : role === "sales_manager" ? "negotiation-status" : role === "viewer" ? "inactive-status" : "new-status";
}
function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Members() {
  const { user, logout } = useAuthUser();
  const role = user?.role || ROLES.SALES_REP;
  const canManage = MANAGEMENT_ROLES.includes(role);
  const isAdmin = role === ROLES.ORG_ADMIN;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/members`, { headers: authHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load members.");
      setMembers(data.members || []);
      setError("");
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user && canManage) fetchMembers(); else setLoading(false); }, [user, canManage]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch = !query || [member.fullName, member.email, ROLE_LABELS[member.role]].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All" || member.status === statusFilter;
      const matchesRole = roleFilter === "All Roles" || member.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [members, search, statusFilter, roleFilter]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((member) => member.status === "Active").length,
    admins: members.filter((member) => member.role === "org_admin").length,
    pending: members.filter((member) => member.status === "Pending").length,
  }), [members]);

  if (!user) return null;
  if (!canManage) return <Navigate to="/dashboard" replace />;

  const showMessage = (text) => { setMessage(text); window.setTimeout(() => setMessage(""), 3000); };
  const handleCreate = async (memberData) => {
    const response = await fetch(`${API_URL}/members`, { method: "POST", headers: authHeader(), body: JSON.stringify(memberData) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to invite member.");
    setMembers((current) => [data.member, ...current]);
    setIsModalOpen(false);
    showMessage("Invitation sent successfully.");
  };
  const updateMember = async (member, updates) => {
    const response = await fetch(`${API_URL}/members/${member.id || member._id}`, { method: "PATCH", headers: authHeader(), body: JSON.stringify(updates) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update member.");
    setMembers((current) => current.map((item) => item.id === member.id ? data.member : item));
    showMessage("Member updated successfully.");
  };
  const handleDelete = async (member) => {
    if (!window.confirm(`Remove ${member.fullName} from the organization?`)) return;
    const response = await fetch(`${API_URL}/members/${member.id || member._id}`, { method: "DELETE", headers: authHeader() });
    const data = await response.json();
    if (!response.ok) return setError(data.message || "Failed to remove member.");
    setMembers((current) => current.filter((item) => item.id !== member.id));
    showMessage("Member removed successfully.");
  };
  const handleDeactivate = async (member) => {
    if (!window.confirm("Are you sure you want to deactivate this member?")) return;
    try { await updateMember(member, { status: "Inactive" }); } catch (updateError) { setError(updateError.message); }
  };
  const handleResend = async (member) => {
    try {
      const response = await fetch(`${API_URL}/members/${member.id || member._id}/resend-invitation`, { method: "POST", headers: authHeader() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to resend invitation.");
      showMessage(data.message);
    } catch (updateError) { setError(updateError.message); }
  };
  const handleActionToggle = (memberId, event) => {
    if (openActionMenu === memberId) return setOpenActionMenu(null);
    const bounds = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({ top: bounds.bottom + 6, left: Math.max(8, bounds.right - 150) });
    setOpenActionMenu(memberId);
  };

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />
      <main className="dashboard-content">
        {message && <div className="lead-message success"><span className="lead-message-icon">✓</span><span>{message}</span></div>}
        {error && <div className="lead-message error"><span className="lead-message-icon">!</span><span>{error}</span></div>}
        <header className="dashboard-header">
          <div><h1>Members</h1><p>Manage your organization members and their roles.</p></div>
          <div className="header-actions">
            <div className="search-box"><span className="search-icon">⌕</span><input placeholder="Search members..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            {canManage && <button type="button" className="add-lead-btn" onClick={() => setIsModalOpen(true)}>+ Add Member</button>}
          </div>
        </header>
        <section className="stats-grid leads-stats-grid">
          {[ ["TOTAL MEMBERS", stats.total, "purple", "◍"], ["ACTIVE MEMBERS", stats.active, "green", "✓"], ["ADMINS", stats.admins, "blue", "★"], ["PENDING INVITES", stats.pending, "orange", "◷"] ].map(([label, value, color, icon]) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><div className={`stat-icon ${color}`}>{icon}</div></div><h2>{value}</h2></div>)}
        </section>
        <section className="dashboard-card leads-table-card">
          <div className="leads-filter-bar">
            {["All", "Active", "Pending", "Inactive"].map((filter) => <button type="button" key={filter} className={`filter-chip ${statusFilter === filter ? "active" : ""}`} onClick={() => setStatusFilter(filter)}>{filter}</button>)}
            <select className="members-role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>All Roles</option>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="leads-table full-leads-table members-table" data-with-owner="true">
            <div className="table-head"><span>Member</span><span>Email</span><span>Role</span><span>Status</span><span>Joined</span><span>Actions</span></div>
            {loading ? <div className="leads-empty"><div className="lead-loading-spinner" /><span>Loading members...</span></div> : filteredMembers.length === 0 ? <div className="leads-empty"><strong>No members found</strong><span>Try adjusting your search or filters.</span></div> : filteredMembers.map((member) => {
              const memberId = member.id || member._id;
              const canChange = isAdmin || (role === ROLES.SALES_MANAGER && member.role !== "org_admin");
              return <div className="lead-row" key={memberId}><span className="member-cell"><span className="member-avatar">{initials(member.fullName)}</span><span className="member-name">{member.fullName}</span></span><span>{member.email}</span><span><span className={`status ${roleClass(member.role)}`}>{ROLE_LABELS[member.role] || member.role}</span></span><span><span className={`status ${statusClass(member.status)}`}>{member.status}</span></span><span className="lead-value">{formatDate(member.createdAt)}</span><div className="lead-actions lead-actions-menu" onClick={(event) => event.stopPropagation()}><button type="button" className="customer-action-trigger" aria-label={`Actions for ${member.fullName}`} onClick={(event) => handleActionToggle(memberId, event)}>⋮</button>{openActionMenu === memberId && <div className="customer-action-dropdown" style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}><button type="button" onClick={() => { setViewingMember(member); setOpenActionMenu(null); }}>View Profile</button>{canChange && <button type="button" onClick={() => { setEditingMember(member); setOpenActionMenu(null); }}>Edit Role</button>}{canChange && member.status === "Active" && <button type="button" onClick={() => { handleDeactivate(member); setOpenActionMenu(null); }}>Deactivate</button>}{canChange && member.status === "Pending" && <button type="button" onClick={() => { handleResend(member); setOpenActionMenu(null); }}>Resend Invitation</button>}{isAdmin && member.status === "Pending" && <button type="button" onClick={() => { handleDeactivate(member); setOpenActionMenu(null); }}>Cancel Invitation</button>}{isAdmin && memberId !== user.id && <button type="button" className="danger" onClick={() => { handleDelete(member); setOpenActionMenu(null); }}>Remove Member</button>}</div>}</div></div>;
            })}
          </div>
        </section>
      </main>
      <AddMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
      {viewingMember && <MemberProfileModal member={viewingMember} onClose={() => setViewingMember(null)} />}
      {editingMember && <RoleModal member={editingMember} canAssignAdmin={isAdmin} onClose={() => setEditingMember(null)} onSave={async (newRole) => { try { await updateMember(editingMember, { role: newRole }); setEditingMember(null); } catch (updateError) { setError(updateError.message); } }} />}
    </div>
  );
}

function MemberProfileModal({ member, onClose }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="member-profile-title" onClick={(event) => event.stopPropagation()}><div className="lead-modal-header"><h3 id="member-profile-title">Member Profile</h3><button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button></div><div className="lead-modal-grid"><div className="member-profile-hero lead-field-full"><span className="member-avatar">{initials(member.fullName)}</span><div><strong>{member.fullName}</strong><span>{member.email}</span></div></div><div className="lead-field"><label>Role</label><div><span className={`status ${roleClass(member.role)}`}>{ROLE_LABELS[member.role] || member.role}</span></div></div><div className="lead-field"><label>Status</label><div><span className={`status ${statusClass(member.status)}`}>{member.status}</span></div></div><div className="lead-field"><label>Joined</label><input value={formatDate(member.createdAt)} readOnly /></div><div className="lead-field"><label>Member ID</label><input value={String(member.id || member._id)} readOnly /></div></div><div className="lead-modal-actions"><button type="button" className="modal-cancel-btn" onClick={onClose}>Close</button></div></div></div>;
}

function RoleModal({ member, canAssignAdmin, onClose, onSave }) {
  const [role, setRole] = useState(member.role);
  const options = canAssignAdmin ? Object.keys(ROLE_LABELS) : Object.keys(ROLE_LABELS).filter((value) => value !== "org_admin");
  return <div className="modal-backdrop" onClick={onClose}><div className="lead-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="lead-modal-header"><h3>Edit Role</h3><button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button></div><div className="lead-modal-grid"><div className="lead-field lead-field-full"><label>Member Name</label><input value={member.fullName} readOnly /></div><div className="lead-field lead-field-full"><label>Current Role</label><input value={ROLE_LABELS[member.role]} readOnly /></div><div className="lead-field lead-field-full"><label>New Role</label><select value={role} onChange={(event) => setRole(event.target.value)}>{options.map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}</select></div></div><div className="lead-modal-actions"><button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button><button type="button" className="add-lead-btn" onClick={() => onSave(role)}>Save Changes</button></div></div></div>;
}

export default Members;
