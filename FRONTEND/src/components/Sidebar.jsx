import { Link, useLocation } from "react-router-dom";
import { ROLES, ROLE_LABELS, NAV_CONFIG } from "../config/dashboardConfig";

// ── INLINE SVG ICONS ──────────────────────────────────────
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

function NavButton({ item, isActive }) {
  const className = `sidebar-item ${isActive ? "active" : ""}`;

  if (item.path) {
    return (
      <Link to={item.path} className={className}>
        <span className="nav-icon">{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <button className={`${className} sidebar-placeholder`} disabled>
      <span className="nav-icon">{item.icon}</span>
      {item.label}
    </button>
  );
}

function Sidebar({ user, role, onLogout }) {
  const location = useLocation();
  const nav = NAV_CONFIG[role];

  if (!user || !nav) return null;

  const initial = user.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside className="dashboard-sidebar">

      {/* LOGO */}
      <div className="dashboard-logo">
        <h2>Mini CRM</h2>
        <span>CRM</span>
      </div>

      {/* ORG BADGE */}
      {role !== ROLES.SUPER_ADMIN && user.orgName && (
        <div className="org-badge">
          <span className="org-dot" />
          <span className="org-name">{user.orgName}</span>
        </div>
      )}

      {/* NAV — flex grows to fill space */}
      <div className="sidebar-nav-scroll">

        <div className="sidebar-section">
          <p className="sidebar-title">WORKSPACE</p>
          {nav.workspace.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>

        {nav.manage.length > 0 && (
          <div className="sidebar-section" style={{ marginTop: "18px" }}>
            <p className="sidebar-title">MANAGE</p>
            {nav.manage.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                isActive={location.pathname === item.path}
              />
            ))}
          </div>
        )}

      </div>

      {/* BOTTOM — profile + logout always visible */}
      <div className="sidebar-bottom">

        <div className="sidebar-profile">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-info">
            <p className="profile-name">{user.fullName}</p>
            <p className="profile-role">{ROLE_LABELS[role] || role}</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-item logout-item"
          onClick={onLogout}
        >
          <span className="nav-icon"><LogoutIcon /></span>
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;