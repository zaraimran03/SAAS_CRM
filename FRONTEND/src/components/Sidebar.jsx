import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ROLES, ROLE_LABELS, NAV_CONFIG } from "../config/dashboardConfig";
import "../styles/Sidebar.css";

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

<<<<<<< HEAD
// Read persisted collapsed state; fall back to window width on mobile
function getInitialCollapsed() {
  const stored = localStorage.getItem("sidebarCollapsed");
  if (stored !== null) return stored === "true";
  return window.innerWidth < 768;
}

function Sidebar({ user, role, onLogout }) {
  const location = useLocation();
  const nav = NAV_CONFIG[role];
  const [collapsed, setCollapsed] = React.useState(getInitialCollapsed);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  // Auto-collapse on mobile resize, but don't override desktop preference
  React.useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        localStorage.setItem("sidebarCollapsed", "true");
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
=======
function Sidebar({ user, role, onLogout }) {
  const location = useLocation();
  const nav = NAV_CONFIG[role];
  const [collapsed, setCollapsed] = React.useState(window.innerWidth < 768);

  // Auto collapse/expand on window resize
  React.useEffect(() => {
    const handler = () => setCollapsed(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
  }, []);

  if (!user || !nav) return null;

  const initial = user.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
<<<<<<< HEAD
    <aside className={`dashboard-sidebar ${collapsed ? "collapsed" : ""}`}>
=======
    <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''}`}>
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146

      {/* LOGO */}
      <div className="dashboard-logo">
        <h2>Mini CRM</h2>
        <span>CRM</span>
      </div>

<<<<<<< HEAD
      {/* MOBILE / MANUAL TOGGLE */}
      <button className="sidebar-toggle" onClick={toggleCollapse} aria-label="Toggle navigation">
=======
      {/* MOBILE TOGGLE */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle navigation">
        {/* simple hamburger */}
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* ORG BADGE */}
      {role !== ROLES.SUPER_ADMIN && user.orgName && (
        <div className="org-badge">
          <span className="org-dot" />
          <span className="org-name">{user.orgName}</span>
        </div>
      )}

<<<<<<< HEAD
      {/* NAV */}
=======
      {/* NAV — flex grows to fill space */}
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
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
<<<<<<< HEAD
          <>
            <hr className="sidebar-divider" />
            <div className="sidebar-section">
              <p className="sidebar-title">MANAGE</p>
              {nav.manage.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  isActive={location.pathname === item.path}
                />
              ))}
            </div>
          </>
=======
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
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
        )}

      </div>

<<<<<<< HEAD
      {/* BOTTOM — profile + logout */}
      <div className="sidebar-bottom">

        <Link to="/settings" className="sidebar-profile" style={{ textDecoration: "none" }}>
          <div className="profile-avatar">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
=======
      {/* BOTTOM — profile + logout always visible */}
      <div className="sidebar-bottom">

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146
            ) : (
              initial
            )}
          </div>
          <div className="profile-info">
            <p className="profile-name">{user.fullName}</p>
            <p className="profile-role">{ROLE_LABELS[role] || role}</p>
          </div>
<<<<<<< HEAD
        </Link>
=======
        </div>
>>>>>>> f47bcffec4428929a47fcf970e5c85cf6b13b146

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