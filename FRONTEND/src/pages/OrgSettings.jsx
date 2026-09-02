import { useState, useRef, useEffect } from "react";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import { ROLES } from "../config/dashboardConfig";
import "../styles/Dashboard.css";
import "../styles/OrgSettings.css";

// ── SVG ICONS ──
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

function OrgSettings() {
  const { user, logout } = useAuthUser();
  const role = user?.role || ROLES.ORG_ADMIN;

  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef(null);
  
  // Password Visibility
  const [showPwd, setShowPwd] = useState(false);

  // Form States
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 000-0000",
    role: role,
    avatar: null,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "John Doe",
        email: user.email || "john.doe@example.com",
        phone: user.phone || "+1 (555) 000-0000",
        role: user.role || role,
        avatar: user.avatar || null,
      });
    }
  }, [user, role]);

  const [org, setOrg] = useState({
    name: "Acme Corp",
    industry: "Software",
    size: "50-249 employees",
    website: "https://acmecorp.com",
    timezone: "America/New_York (EST)",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    newLead: true,
    dealWon: true,
    weeklyReport: false,
  });

  if (!user) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (!btn) return;
    const originalText = btn.innerText;
    btn.innerText = "Saved Successfully";
    btn.classList.add("btn-success");
    
    // Persist to session storage for the mock
    const updatedUser = { ...user, fullName: profile.fullName, phone: profile.phone, avatar: profile.avatar };
    sessionStorage.setItem("user", JSON.stringify(updatedUser));

    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove("btn-success");
      window.location.reload(); // Refresh to update Sidebar and header
    }, 1000);
  };

  const toggleNotif = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account preferences and system configurations.</p>
          </div>
        </header>

        {/* ── TOP HORIZONTAL TABS ── */}
        <div className="settings-tabs">
          {[
            { key: "profile", label: "My Profile" },
            ...(role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN ? [{ key: "org", label: "Organization" }] : []),
            { key: "notifications", label: "Notifications" },
            { key: "security", label: "Security" },
          ].map(t => (
            <button
              key={t.key}
              className={`settings-tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SETTINGS CONTENT ── */}
        <div className="settings-content-wrapper fade-in">
          
          {/* ════ PROFILE TAB ════ */}
          {activeTab === "profile" && (
            <form className="dashboard-card settings-card" onSubmit={handleSave}>
              <div className="card-heading settings-header">
                <div>
                  <h3>Personal Information</h3>
                  <p>Update your photo and personal details.</p>
                </div>
              </div>
              
              <div className="settings-body">
                {/* Avatar Upload */}
                <div className="avatar-upload-block">
                  <div className="avatar-preview-circle" onClick={triggerFileSelect}>
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="avatar-img" />
                    ) : (
                      <span className="avatar-initials">{profile.fullName.charAt(0)}</span>
                    )}
                    <div className="avatar-overlay">
                      <span>Edit</span>
                    </div>
                  </div>
                  <div className="avatar-text">
                    <h4>Profile Picture</h4>
                    <p>PNG, JPG or GIF (max. 800x800px)</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: "none" }} 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <button type="button" className="btn-outline" onClick={triggerFileSelect}>
                      Upload new picture
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input 
                      className="settings-input" 
                      value={profile.fullName}
                      onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input 
                      className="settings-input" 
                      type="email" 
                      value={profile.email} 
                      disabled 
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input 
                      className="settings-input" 
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="input-group">
                    <label>Role</label>
                    <input 
                      className="settings-input" 
                      value={profile.role.replace("_", " ").toUpperCase()} 
                      disabled 
                    />
                  </div>
                </div>
              </div>

              <div className="settings-footer">
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          )}

          {/* ════ ORG TAB ════ */}
          {activeTab === "org" && (
            <div className="settings-stack">
              
              {/* Identity Card */}
              <form className="dashboard-card settings-card" onSubmit={handleSave}>
                <div className="card-heading settings-header">
                  <div>
                    <h3>Company Identity</h3>
                    <p>Manage your company's public identity.</p>
                  </div>
                </div>
                
                <div className="settings-body">
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Company Name</label>
                      <input 
                        className="settings-input" 
                        value={org.name}
                        onChange={(e) => setOrg({...org, name: e.target.value})}
                      />
                    </div>
                    <div className="input-group">
                      <label>Website</label>
                      <input 
                        className="settings-input" 
                        value={org.website}
                        onChange={(e) => setOrg({...org, website: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
                <div className="settings-footer">
                  <button type="submit" className="btn-primary">Update Identity</button>
                </div>
              </form>

              {/* Operations Card */}
              <form className="dashboard-card settings-card" onSubmit={handleSave}>
                <div className="card-heading settings-header">
                  <div>
                    <h3>Operations & Regional</h3>
                    <p>Set default timezones and industry categorization for reporting.</p>
                  </div>
                </div>
                
                <div className="settings-body">
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Industry</label>
                      <select 
                        className="settings-input"
                        value={org.industry}
                        onChange={(e) => setOrg({...org, industry: e.target.value})}
                      >
                        <option>Software</option>
                        <option>Healthcare</option>
                        <option>Finance</option>
                        <option>E-commerce</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Company Size</label>
                      <select 
                        className="settings-input"
                        value={org.size}
                        onChange={(e) => setOrg({...org, size: e.target.value})}
                      >
                        <option>1-10 employees</option>
                        <option>11-49 employees</option>
                        <option>50-249 employees</option>
                        <option>250+ employees</option>
                      </select>
                    </div>
                    <div className="input-group full-width">
                      <label>Default Timezone</label>
                      <select 
                        className="settings-input"
                        value={org.timezone}
                        onChange={(e) => setOrg({...org, timezone: e.target.value})}
                      >
                        <option>America/New_York (EST)</option>
                        <option>America/Chicago (CST)</option>
                        <option>America/Los_Angeles (PST)</option>
                        <option>Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="settings-footer">
                  <button type="submit" className="btn-primary">Update Operations</button>
                </div>
              </form>

            </div>
          )}

          {/* ════ NOTIFICATIONS TAB ════ */}
          {activeTab === "notifications" && (
            <div className="dashboard-card settings-card">
              <div className="card-heading settings-header">
                <div>
                  <h3>Email Notifications</h3>
                  <p>Choose what events trigger an email to your inbox.</p>
                </div>
              </div>
              
              <div className="settings-body no-pad-top">
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Account Summaries</h4>
                    <p>Receive summaries and important system notifications.</p>
                  </div>
                  <div className={`toggle-switch ${notifications.emailAlerts ? 'on' : ''}`} onClick={() => toggleNotif("emailAlerts")}>
                    <div className="toggle-knob"></div>
                  </div>
                </div>

                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Lead Assignment</h4>
                    <p>Get notified immediately when a new lead is assigned to you.</p>
                  </div>
                  <div className={`toggle-switch ${notifications.newLead ? 'on' : ''}`} onClick={() => toggleNotif("newLead")}>
                    <div className="toggle-knob"></div>
                  </div>
                </div>

                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Deal Won Updates</h4>
                    <p>Celebrate when someone on your team closes a deal.</p>
                  </div>
                  <div className={`toggle-switch ${notifications.dealWon ? 'on' : ''}`} onClick={() => toggleNotif("dealWon")}>
                    <div className="toggle-knob"></div>
                  </div>
                </div>

                <div className="toggle-row">
                  <div className="toggle-info">
                    <h4>Weekly Reports</h4>
                    <p>Receive a weekly summary of pipeline health and activities.</p>
                  </div>
                  <div className={`toggle-switch ${notifications.weeklyReport ? 'on' : ''}`} onClick={() => toggleNotif("weeklyReport")}>
                    <div className="toggle-knob"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ SECURITY TAB ════ */}
          {activeTab === "security" && (
            <form className="dashboard-card settings-card" onSubmit={handleSave}>
              <div className="card-heading settings-header">
                <div>
                  <h3>Password Management</h3>
                  <p>Update your password to keep your account secure.</p>
                </div>
              </div>
              
              <div className="settings-body">
                <div className="form-grid">
                  <div className="input-group full-width">
                    <label>Current Password</label>
                    <div className="password-wrapper">
                      <input className="settings-input" type={showPwd ? "text" : "password"} placeholder="••••••••" />
                      <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>New Password</label>
                    <div className="password-wrapper">
                      <input className="settings-input" type={showPwd ? "text" : "password"} placeholder="••••••••" />
                      <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Confirm New Password</label>
                    <div className="password-wrapper">
                      <input className="settings-input" type={showPwd ? "text" : "password"} placeholder="••••••••" />
                      <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-footer">
                <button type="submit" className="btn-primary">Update Password</button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}

export default OrgSettings;
