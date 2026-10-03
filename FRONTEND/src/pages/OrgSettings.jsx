import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import { ROLES, ROLE_LABELS } from "../config/dashboardConfig";
import "../styles/Dashboard.css";
import "../styles/OrgSettings.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SETTINGS_API = `${API}/settings`;
const auth = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("accessToken")}` });
const DEFAULT_NOTIFICATIONS = { taskAssigned: true, taskDue: true, taskOverdue: true, newLeadAssigned: true, dealWon: false, dealLost: true, newActivity: true, emailNotifications: true, inAppNotifications: true };
const CONFIG_LABELS = { leadStatuses: "Lead Statuses", leadSources: "Lead Sources", dealStages: "Deal Pipeline Stages", lostReasons: "Lost Reasons", taskStatuses: "Task Statuses", taskPriorities: "Task Priorities", taskTypes: "Task Types", activityTypes: "Activity Types" };

function SettingsCard({ title, description, children, onSave, saving, disabled }) {
  return <section className="dashboard-card settings-card"><div className="card-heading settings-header"><div><h3>{title}</h3>{description && <p>{description}</p>}</div></div><div className="settings-body">{children}</div>{onSave && <div className="settings-footer"><button type="button" className="btn-primary" disabled={saving || disabled} onClick={onSave}>{saving ? "Saving..." : "Save Changes"}</button></div>}</section>;
}
function Field({ label, children, full = false }) { return <div className={`input-group ${full ? "full-width" : ""}`}><label>{label}</label>{children}</div>; }
function Toggle({ label, value, onChange }) { return <button type="button" className={`toggle-switch ${value ? "on" : ""}`} aria-pressed={value} aria-label={label} onClick={() => onChange(!value)}><span className="toggle-knob" /></button>; }
function EyeIcon({ open }) { return open ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /><path d="m3 3 18 18" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>; }
function Message({ text, error }) { return text ? <p className={error ? "save-error" : "pwd-success"}>{text}</p> : null; }
function isAdmin(role) { return role === ROLES.ORG_ADMIN; }

function OrgSettings() {
  const { user, logout } = useAuthUser();
  const navigate = useNavigate();
  const role = user?.role || ROLES.ORG_ADMIN;
  const canOrg = isAdmin(role);
  const canConfig = canOrg || role === ROLES.SALES_MANAGER;
  // Build nav tabs — Notifications removed from UI (defaults apply automatically)
  const ALL_TABS = ["General", "Profile", "CRM Configuration", "Security"];
  const categories = ALL_TABS.filter((item) => {
    if (item === "General") return canOrg;
    if (item === "CRM Configuration") return canConfig;
    return true;
  });
  const [active, setActive] = useState("Profile");
  const [organization, setOrganization] = useState({ organizationName: "", workspaceName: "", logo: null, industry: "", currency: "USD", timezone: "UTC", dateFormat: "MM/DD/YYYY" });
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", avatar: null });
  const [config, setConfig] = useState({});
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Profile images must be 4 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setProfile((current) => ({ ...current, avatar: reader.result }));
    reader.onerror = () => setError("The selected profile image could not be read.");
    reader.readAsDataURL(file);
  };

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(SETTINGS_API, { headers: auth() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load settings.");
      setOrganization(data.organization || {});
      setProfile({ fullName: data.user.fullName || "", email: data.user.email || "", phone: data.user.phone || "", avatar: data.user.avatar || null });
      setConfig(data.organization?.crmConfig || {});
    } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (user) loadSettings(); }, [user, loadSettings]);
  const flash = (text) => { setMessage(text); setError(""); window.setTimeout(() => setMessage(""), 3000); };
  const save = async (url, body, success) => {
    setSaving(true); setError("");
    try { const response = await fetch(url, { method: "PATCH", headers: auth(), body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed to save settings."); flash(data.message || success); await loadSettings(); } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };
  const updateProfile = async () => {
    setSaving(true); setError("");
    try { const response = await fetch(`${API.replace(/\/$/, "")}/users/profile`, { method: "PUT", headers: auth(), body: JSON.stringify(profile) }); const contentType = response.headers.get("content-type") || ""; if (!contentType.includes("application/json")) throw new Error("The profile API returned a non-JSON response. Check the backend URL."); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Failed to save profile."); const updatedUser = { ...user, ...data.user }; sessionStorage.setItem("user", JSON.stringify(updatedUser)); window.dispatchEvent(new CustomEvent("crm:user-updated", { detail: updatedUser })); flash("Profile settings saved successfully."); } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };
  const deleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return setError('Type DELETE to confirm.');
    if (!deletePassword) return setError("Current password is required.");
    setSaving(true); setError("");
    try {
      const response = await fetch(`${API.replace(/\/$/, "")}/users/account`, {
        method: "DELETE",
        headers: auth(),
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete account.");
      // Clear all session data before navigating
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      logout();
    } catch (deleteError) {
      setError(deleteError.message);
      setSaving(false);
    }
  };
  const changePassword = async () => {
    if (password.newPassword !== password.confirmPassword) return setError("Passwords do not match.");
    await save(`${SETTINGS_API}/password`, password, "Password updated successfully.");
    setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };
  const updateConfigItem = (key, index, value) => setConfig((current) => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item) }));
  const addConfigItem = (key) => setConfig((current) => ({ ...current, [key]: [...(current[key] || []), "New item"] }));
  const removeConfigItem = (key, index) => setConfig((current) => ({ ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) }));

  if (!user) return null;
  return <div className="dashboard-page"><Sidebar user={user} role={role} onLogout={logout} /><main className="dashboard-content">
    <header className="dashboard-header"><div><button type="button" className="settings-back-btn" onClick={() => navigate("/dashboard")}>← Back to Dashboard</button><h1>Settings</h1><p>Manage your account, workspace, CRM preferences, and security.</p></div></header>
    {message && <div className="lead-message success">✓ {message}</div>}{error && <div className="lead-message error">! {error}</div>}
    <div className="settings-layout"><nav className="settings-navigation">{categories.map((category) => <button type="button" key={category} className={active === category ? "active" : ""} onClick={() => setActive(category)}>{category}</button>)}</nav><div className="settings-panel">
      {loading ? (
        <div className="dashboard-card settings-card"><div className="settings-body">Loading settings...</div></div>
      ) : (
        <>
          {active === "General" && (
            <SettingsCard title="General" description="Manage your organization and workspace preferences." onSave={() => save(`${SETTINGS_API}/organization`, organization, "General settings saved successfully.")} saving={saving} disabled={!canOrg}>
              <div className="form-grid">
                <Field label="Organization Name"><input className="settings-input" value={organization.organizationName} disabled={!canOrg} onChange={(e) => setOrganization({ ...organization, organizationName: e.target.value })} /></Field>
                <Field label="Workspace Name"><input className="settings-input" value={organization.workspaceName} disabled={!canOrg} onChange={(e) => setOrganization({ ...organization, workspaceName: e.target.value })} /></Field>
                <Field label="Company Logo URL"><input className="settings-input" value={organization.logo || ""} disabled={!canOrg} placeholder="https://..." onChange={(e) => setOrganization({ ...organization, logo: e.target.value })} /></Field>
                <Field label="Industry"><input className="settings-input" value={organization.industry} disabled={!canOrg} onChange={(e) => setOrganization({ ...organization, industry: e.target.value })} /></Field>
                <Field label="Currency"><select className="settings-input" value={organization.currency} disabled={!canOrg} onChange={(e) => setOrganization({ ...organization, currency: e.target.value })}><option>USD</option><option>EUR</option><option>GBP</option><option>PKR</option></select></Field>
                <Field label="Time Zone"><select className="settings-input" value={organization.timezone} disabled={!canOrg} onChange={(e) => setOrganization({ ...organization, timezone: e.target.value })}><option>UTC</option><option>America/New_York</option><option>Europe/London</option><option>Asia/Karachi</option><option>Asia/Dubai</option></select></Field>
                <Field label="Date Format"><select className="settings-input" value={organization.dateFormat} disabled={!canOrg} onChange={(e) => setOrganization({ ...organization, dateFormat: e.target.value })}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></Field>
              </div>
              {!canOrg && <Message text="Only organization admins can change workspace settings." error />}
            </SettingsCard>
          )}

          {active === "Profile" && (
            <SettingsCard title="Profile" description="Manage your personal account information." onSave={updateProfile} saving={saving}>
              <div className="avatar-upload-block">
                <div className="avatar-preview-circle">
                  {profile.avatar ? <img src={profile.avatar} alt="Profile avatar" className="avatar-img" /> : <span className="avatar-initials">{profile.fullName?.charAt(0) || "?"}</span>}
                </div>
                <div className="avatar-text">
                  <h4>{profile.fullName || "Your profile"}</h4>
                  <p>{ROLE_LABELS[profile.role] || ROLE_LABELS[role] || role}</p>
                  <label className="btn-outline">Upload new picture<input type="file" accept="image/png,image/jpeg,image/gif" hidden onChange={handleAvatar} /></label>
                </div>
              </div>
              <div className="form-grid">
                <Field label="Full Name"><input className="settings-input" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></Field>
                <Field label="Phone"><input className="settings-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
                <Field label="Email"><input className="settings-input readonly" value={profile.email} disabled /></Field>
              </div>
            </SettingsCard>
          )}

          {active === "CRM Configuration" && (
            <SettingsCard title="CRM Configuration" description="Customize the lists used across your CRM." onSave={() => save(`${SETTINGS_API}/crm`, config, "CRM configuration saved successfully.")} saving={saving} disabled={!canConfig}>
              {!canConfig && <Message text="CRM configuration is available to admins and managers." error />}
              {Object.entries(CONFIG_LABELS).map(([key, label]) => (
                <div className="config-list" key={key}>
                  <div className="config-list-header"><h4>{label}</h4><button type="button" className="btn-outline" disabled={!canConfig} onClick={() => addConfigItem(key)}>+ Add</button></div>
                  {(config[key] || []).map((item, index) => (
                    <div className="config-item" key={`${key}-${index}`}>
                      <input className="settings-input" value={item} disabled={!canConfig} onChange={(e) => updateConfigItem(key, index, e.target.value)} />
                      <button type="button" className="delete-lead-btn" disabled={!canConfig || (config[key] || []).length <= 1} onClick={() => removeConfigItem(key, index)}>×</button>
                    </div>
                  ))}
                </div>
              ))}
            </SettingsCard>
          )}

          {active === "Security" && (
            <>
              {/* ── Change Password ── */}
              <SettingsCard title="Change Password" description="Verify your current password before setting a new one." onSave={changePassword} saving={saving}>
                <div className="form-grid">
                  <Field label="Current Password">
                    <div className="settings-password-field">
                      <input className="settings-input" type={showPassword.currentPassword ? "text" : "password"} value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} />
                      <button type="button" className="settings-eye-button" aria-label={showPassword.currentPassword ? "Hide" : "Show"} onClick={() => setShowPassword({ ...showPassword, currentPassword: !showPassword.currentPassword })}><EyeIcon open={showPassword.currentPassword} /></button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="settings-password-field">
                      <input className="settings-input" type={showPassword.newPassword ? "text" : "password"} value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} />
                      <button type="button" className="settings-eye-button" aria-label={showPassword.newPassword ? "Hide" : "Show"} onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })}><EyeIcon open={showPassword.newPassword} /></button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password">
                    <div className="settings-password-field">
                      <input className="settings-input" type={showPassword.confirmPassword ? "text" : "password"} value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} />
                      <button type="button" className="settings-eye-button" aria-label={showPassword.confirmPassword ? "Hide" : "Show"} onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })}><EyeIcon open={showPassword.confirmPassword} /></button>
                    </div>
                  </Field>
                </div>
              </SettingsCard>

              {/* ── Delete Account ── */}
              <SettingsCard title="Delete Account" description="Permanently remove your account from Mini CRM.">
                <p className="settings-warning">
                  ⚠️ This action is <strong>irreversible</strong>. Your sign-in account will be permanently deleted.
                  CRM records, leads, deals, and organization data are retained.
                </p>
                {showDeleteConfirmation ? (
                  <div className="account-delete-confirm">
                    <Field label="Current Password" full>
                      <input
                        className="settings-input"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                    </Field>
                    <Field label='Type DELETE to confirm' full>
                      <input
                        className={`settings-input ${deleteConfirmText && deleteConfirmText !== "DELETE" ? "input-error" : ""}`}
                        placeholder="DELETE"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                      />
                    </Field>
                    <div className="account-delete-actions">
                      <button
                        type="button"
                        className="modal-cancel-btn"
                        onClick={() => { setShowDeleteConfirmation(false); setDeletePassword(""); setDeleteConfirmText(""); setError(""); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="settings-danger-action"
                        disabled={saving || !deletePassword || deleteConfirmText !== "DELETE"}
                        onClick={deleteAccount}
                      >
                        {saving ? "Deleting…" : "Confirm Delete Account"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="settings-danger-action" onClick={() => setShowDeleteConfirmation(true)}>
                    Delete Account
                  </button>
                )}
              </SettingsCard>
            </>
          )}
        </>
      )}
    </div></div>
  </main></div>;
}

export default OrgSettings;
