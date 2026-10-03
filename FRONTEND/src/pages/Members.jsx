import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import "../styles/Dashboard.css";
import "../styles/Leads.css";
import "../styles/AddLeadModal.css";
import "../styles/Members.css";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import AddMemberModal from "../components/AddMemberModal";
import { ROLES } from "../config/dashboardConfig";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/users`
  : "http://localhost:5000/users";

const MANAGEMENT_ROLES = [ROLES.ORG_ADMIN, ROLES.SALES_MANAGER];
const ROLE_LABELS = {
  org_admin:     "Admin",
  sales_manager: "Manager",
  sales_rep:     "Sales Member",
  viewer:        "Viewer",
};
const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

function initials(name = "") {
  return (
    name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "U"
  );
}
function statusClass(status) {
  return status === "Active" ? "won-status" : status === "Pending" ? "proposal-status" : "inactive-status";
}
function roleClass(role) {
  return role === "org_admin"
    ? "won-status"
    : role === "sales_manager"
    ? "negotiation-status"
    : role === "viewer"
    ? "inactive-status"
    : "new-status";
}
function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Avatar colour helpers ─────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#ede9fe", "#7c3aed"],
  ["#dcfce7", "#16a34a"],
  ["#dbeafe", "#1d4ed8"],
  ["#fef9c3", "#a16207"],
  ["#ffe4e6", "#be123c"],
  ["#e0f2fe", "#0369a1"],
];
function avatarColor(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] || AVATAR_COLORS[0];
}

// ─── Members Component ─────────────────────────────────────────────────────
function Members() {
  const { user, logout } = useAuthUser();
  const role = user?.role || ROLES.SALES_REP;
  const canManage = MANAGEMENT_ROLES.includes(role);
  const isAdmin = role === ROLES.ORG_ADMIN;

  const [members, setMembers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [message, setMessage]           = useState("");
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter]     = useState("All Roles");
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingMember, setEditingMember]     = useState(null);
  const [viewingMember, setViewingMember]     = useState(null);
  const [emailingMember, setEmailingMember]   = useState(null);
  const [openActionMenu, setOpenActionMenu]   = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const menuRef = useRef(null);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenActionMenu(null);
      }
    };
    if (openActionMenu !== null) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openActionMenu]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/members`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load members.");
      setMembers(data.members || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManage) fetchMembers();
    else setLoading(false);
  }, [user, canManage]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchSearch = !q || [m.fullName, m.email, ROLE_LABELS[m.role]].some((v) => v?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "All" || m.status === statusFilter;
      const matchRole   = roleFilter === "All Roles" || m.role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [members, search, statusFilter, roleFilter]);

  const stats = useMemo(() => ({
    total:   members.length,
    active:  members.filter((m) => m.status === "Active").length,
    admins:  members.filter((m) => m.role === "org_admin").length,
    pending: members.filter((m) => m.status === "Pending").length,
  }), [members]);

  if (!user) return null;
  if (!canManage) return <Navigate to="/dashboard" replace />;

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  };
  const showError = (text) => {
    setError(text);
    window.setTimeout(() => setError(""), 5000);
  };

  // ── CRUD helpers ──────────────────────────────────────────────────────────
  const handleCreate = async (memberData) => {
    const res  = await fetch(`${API_URL}/members`, { method: "POST", headers: authHeader(), body: JSON.stringify(memberData) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to invite member.");
    setMembers((prev) => [data.member, ...prev]);
    setIsModalOpen(false);
    showMessage(`Invitation sent to ${memberData.email}!`);
  };

  const updateMember = async (member, updates) => {
    const memberId = String(member.id || member._id);
    const res  = await fetch(`${API_URL}/members/${memberId}`, { method: "PATCH", headers: authHeader(), body: JSON.stringify(updates) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update member.");
    setMembers((prev) => prev.map((item) => {
      const id = String(item.id || item._id);
      return id === memberId ? { ...item, ...data.member } : item;
    }));
    showMessage("Member updated successfully.");
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Remove ${member.fullName} from the organization? This cannot be undone.`)) return;
    const memberId = String(member.id || member._id);
    const res  = await fetch(`${API_URL}/members/${memberId}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    if (!res.ok) return showError(data.message || "Failed to remove member.");
    setMembers((prev) => prev.filter((item) => String(item.id || item._id) !== memberId));
    showMessage("Member removed.");
  };

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Deactivate ${member.fullName}? They will lose access to the CRM.`)) return;
    try { await updateMember(member, { status: "Inactive" }); } catch (err) { showError(err.message); }
  };

  const handleActivate = async (member) => {
    try { await updateMember(member, { status: "Active" }); } catch (err) { showError(err.message); }
  };

  const handleResend = async (member) => {
    try {
      const res  = await fetch(`${API_URL}/members/${member.id || member._id}/resend-invitation`, { method: "POST", headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend invitation.");
      showMessage(data.message || "Invitation resent.");
    } catch (err) { showError(err.message); }
  };

  const handleActionToggle = (memberId, event) => {
    if (openActionMenu === memberId) return setOpenActionMenu(null);
    const bounds = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({ top: bounds.bottom + 6, left: Math.max(8, bounds.right - 160) });
    setOpenActionMenu(memberId);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-page" onClick={() => openActionMenu && setOpenActionMenu(null)}>
      <Sidebar user={user} role={role} onLogout={logout} />
      <main className="dashboard-content">
        {message && (
          <div className="lead-message success">
            <span className="lead-message-icon">✓</span>
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="lead-message error">
            <span className="lead-message-icon">!</span>
            <span>{error}</span>
          </div>
        )}

        <header className="dashboard-header">
          <div>
            <h1>Members</h1>
            <p>Manage your organization members and their roles.</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {canManage && (
              <button type="button" className="add-lead-btn" onClick={() => setIsModalOpen(true)}>
                + Invite Member
              </button>
            )}
          </div>
        </header>

        {/* Stats */}
        <section className="stats-grid leads-stats-grid">
          {[
            ["TOTAL MEMBERS",  stats.total,   "purple", "◍"],
            ["ACTIVE MEMBERS", stats.active,  "green",  "✓"],
            ["ADMINS",         stats.admins,  "blue",   "★"],
            ["PENDING INVITES",stats.pending, "orange", "◷"],
          ].map(([label, val, color, icon]) => (
            <div className="stat-card" key={label}>
              <div className="stat-top">
                <span>{label}</span>
                <div className={`stat-icon ${color}`}>{icon}</div>
              </div>
              <h2>{val}</h2>
            </div>
          ))}
        </section>

        {/* Table */}
        <section className="dashboard-card leads-table-card">
          <div className="leads-filter-bar">
            {["All", "Active", "Pending", "Inactive"].map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-chip ${statusFilter === f ? "active" : ""}`}
                onClick={() => setStatusFilter(f)}
              >
                {f}
              </button>
            ))}
            <select
              className="members-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option>All Roles</option>
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="leads-table full-leads-table members-table" data-with-owner="true">
            <div className="table-head">
              <span>Member</span>
              <span>Email</span>
              <span>Organization</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div className="leads-empty">
                <div className="lead-loading-spinner" />
                <span>Loading members…</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="leads-empty">
                <strong>No members found</strong>
                <span>Try adjusting your search or filters.</span>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const memberId = String(member.id || member._id);
                const canChange = isAdmin || (role === ROLES.SALES_MANAGER && member.role !== "org_admin");
                const [bg, fg] = avatarColor(member.fullName);
                return (
                  <div className="lead-row" key={memberId} onClick={(e) => e.stopPropagation()}>
                    <span className="member-cell">
                      <span className="member-avatar" style={{ background: bg, color: fg }}>
                        {initials(member.fullName)}
                      </span>
                      <span className="member-name">{member.fullName}</span>
                    </span>
                    <span>{member.email}</span>
                    <span>{member.organizationName || "—"}</span>
                    <span>
                      <span className={`status ${roleClass(member.role)}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </span>
                    <span>
                      <span className={`status ${statusClass(member.status)}`}>
                        {member.status}
                      </span>
                    </span>
                    <span className="lead-value">{formatDate(member.createdAt)}</span>

                    {/* Action menu */}
                    <div className="lead-actions lead-actions-menu">
                      <button
                        type="button"
                        className="customer-action-trigger"
                        aria-label={`Actions for ${member.fullName}`}
                        onClick={(e) => { e.stopPropagation(); handleActionToggle(memberId, e); }}
                      >
                        ⋮
                      </button>
                      {openActionMenu === memberId && (
                        <div
                          ref={menuRef}
                          className="customer-action-dropdown"
                          style={{ top: actionMenuPosition?.top, left: actionMenuPosition?.left }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button type="button" onClick={() => { setViewingMember(member); setOpenActionMenu(null); }}>
                            View Profile
                          </button>
                          {canChange && (
                            <button type="button" onClick={() => { setEditingMember(member); setOpenActionMenu(null); }}>
                              Edit Role
                            </button>
                          )}
                          <button type="button" onClick={() => { setEmailingMember(member); setOpenActionMenu(null); }}>
                            Send Email
                          </button>
                          {canChange && member.status === "Active" && (
                            <button type="button" onClick={() => { handleDeactivate(member); setOpenActionMenu(null); }}>
                              Deactivate
                            </button>
                          )}
                          {canChange && member.status === "Inactive" && (
                            <button type="button" onClick={() => { handleActivate(member); setOpenActionMenu(null); }}>
                              Activate
                            </button>
                          )}
                          {canChange && member.status === "Pending" && (
                            <button type="button" onClick={() => { handleResend(member); setOpenActionMenu(null); }}>
                              Resend Invitation
                            </button>
                          )}
                          {isAdmin && member.status === "Pending" && (
                            <button type="button" onClick={() => { handleDeactivate(member); setOpenActionMenu(null); }}>
                              Cancel Invitation
                            </button>
                          )}
                          {isAdmin && memberId !== String(user.id || user._id) && (
                            <button
                              type="button"
                              className="danger"
                              onClick={() => { handleDelete(member); setOpenActionMenu(null); }}
                            >
                              Remove Member
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        canAssignAdmin={isAdmin}
      />
      {viewingMember && (
        <MemberProfileModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
        />
      )}
      {editingMember && (
        <RoleModal
          member={editingMember}
          canAssignAdmin={isAdmin}
          onClose={() => setEditingMember(null)}
          onSave={async (newRole) => {
            try { await updateMember(editingMember, { role: newRole }); setEditingMember(null); }
            catch (err) { showError(err.message); }
          }}
        />
      )}
      {emailingMember && (
        <SendEmailModal
          member={emailingMember}
          onClose={() => setEmailingMember(null)}
          onSent={showMessage}
          onError={showError}
        />
      )}
    </div>
  );
}

// ─── Member Profile Modal ──────────────────────────────────────────────────
function MemberProfileModal({ member, onClose }) {
  const [bg, fg] = avatarColor(member.fullName);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="member-profile-title" onClick={(e) => e.stopPropagation()}>
        <div className="lead-modal-header">
          <h3 id="member-profile-title">Member Profile</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="lead-modal-grid">
          <div className="member-profile-hero lead-field-full">
            <span className="member-avatar member-avatar-lg" style={{ background: bg, color: fg }}>
              {initials(member.fullName)}
            </span>
            <div>
              <strong>{member.fullName}</strong>
              <span>{member.email}</span>
            </div>
          </div>
          <div className="lead-field">
            <label>Role</label>
            <div><span className={`status ${roleClass(member.role)}`}>{ROLE_LABELS[member.role] || member.role}</span></div>
          </div>
          <div className="lead-field">
            <label>Status</label>
            <div><span className={`status ${statusClass(member.status)}`}>{member.status}</span></div>
          </div>
          <div className="lead-field">
            <label>Organization</label>
            <input value={member.organizationName || "—"} readOnly />
          </div>
          <div className="lead-field">
            <label>Joined</label>
            <input value={formatDate(member.createdAt)} readOnly />
          </div>
          <div className="lead-field lead-field-full">
            <label>Member ID</label>
            <input value={String(member.id || member._id)} readOnly />
          </div>
        </div>
        <div className="lead-modal-actions">
          <button type="button" className="modal-cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Role Modal ───────────────────────────────────────────────────────
const ROLE_DESCRIPTIONS = {
  org_admin:     "Full access — manage members, settings & all data.",
  sales_manager: "Manage leads, deals, customers & view reports.",
  sales_rep:     "Manage assigned leads, deals & log activities.",
  viewer:        "Read-only access to CRM data.",
};

function RoleModal({ member, canAssignAdmin, onClose, onSave }) {
  const [role, setRole]       = useState(member.role);
  const [saving, setSaving]   = useState(false);
  const options = canAssignAdmin
    ? Object.keys(ROLE_LABELS)
    : Object.keys(ROLE_LABELS).filter((v) => v !== "org_admin");

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(role); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="lead-modal-header">
          <h3>Edit Role</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="lead-modal-grid">
          <div className="lead-field lead-field-full">
            <label>Member</label>
            <input value={member.fullName} readOnly />
          </div>
          <div className="lead-field lead-field-full">
            <label>Current Role</label>
            <input value={ROLE_LABELS[member.role] || member.role} readOnly />
          </div>
          <div className="lead-field lead-field-full">
            <label>New Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {options.map((v) => <option key={v} value={v}>{ROLE_LABELS[v]}</option>)}
            </select>
            {role && (
              <span style={{ fontSize: "11px", color: "var(--leads-muted)", marginTop: "4px", display: "block" }}>
                {ROLE_DESCRIPTIONS[role]}
              </span>
            )}
          </div>
        </div>
        <div className="lead-modal-actions">
          <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="add-lead-btn" onClick={handleSave} disabled={saving || role === member.role}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Email Modal ──────────────────────────────────────────────────────
function SendEmailModal({ member, onClose, onSent, onError }) {
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    if (!body.trim()) return;
    setSending(true);
    try {
      // Use mailto: as the actual send mechanism (browser native)
      // This opens the user's email client pre-filled — no extra backend required.
      const mailto = `mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto, "_blank");
      onSent(`Email client opened for ${member.email}.`);
      onClose();
    } catch (err) {
      onError("Could not open email client.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="send-email-title" onClick={(e) => e.stopPropagation()}>
        <div className="lead-modal-header">
          <h3 id="send-email-title">Send Email</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSend} noValidate>
          <div className="lead-modal-grid">
            <div className="lead-field lead-field-full">
              <label>To</label>
              <input value={`${member.fullName} <${member.email}>`} readOnly />
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="email-subject">Subject</label>
              <input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Quick update from the team"
                required
                disabled={sending}
              />
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="email-body">Message</label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here…"
                rows={6}
                required
                disabled={sending}
                style={{ resize: "vertical", minHeight: "120px" }}
              />
            </div>
          </div>
          <div className="lead-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={sending}>Cancel</button>
            <button type="submit" className="add-lead-btn" disabled={sending || !subject.trim() || !body.trim()}>
              {sending ? "Opening…" : "Open in Mail Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Members;
