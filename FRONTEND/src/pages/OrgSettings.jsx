import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../hooks/useAuthUser";
import Sidebar from "../components/Sidebar";
import { ROLES, ROLE_LABELS } from "../config/dashboardConfig";
import "../styles/Dashboard.css";
import "../styles/OrgSettings.css";

// ── ENV ──
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12,19 5,12 12,5"></polyline>
  </svg>
);

// ── AVATAR VALIDATION ──
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 800;

function validateAvatarFile(file) {
  return new Promise((resolve) => {
    if (file.size > MAX_FILE_SIZE) {
      resolve("File is too large. Maximum size is 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          resolve(`Image must be at most ${MAX_DIMENSION}×${MAX_DIMENSION} pixels (yours is ${img.width}×${img.height}).`);
        } else {
          resolve(null); // valid
        }
      };
      img.onerror = () => resolve("Could not read image.");
      img.src = e.target.result;
    };
    reader.onerror = () => resolve("Could not read file.");
    reader.readAsDataURL(file);
  });
}

function OrgSettings() {
  const { user, logout } = useAuthUser();
  const navigate = useNavigate();
  const role = user?.role || ROLES.ORG_ADMIN;

  const [activeTab, setActiveTab]   = useState("profile");
  const fileInputRef                = useRef(null);
  const [showPwd, setShowPwd]       = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [saveError, setSaveError]   = useState("");
  const [saving, setSaving]         = useState(false);

  // ── PROFILE FORM STATE ──
  const emptyProfile = { fullName: "", email: "", phone: "", role: "", avatar: null };
  const [profile, setProfile]         = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(emptyProfile);

  // ── SECURITY FORM STATE ──
  const [pwdForm, setPwdForm]   = useState({ current: "", newPwd: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  // Populate form once user loads
  useEffect(() => {
    if (user) {
      const p = {
        fullName: user.fullName || "",
        email:    user.email    || "",
        phone:    user.phone    || "",
        role:     user.role     || role,
        avatar:   user.avatar   || null,
      };
      setProfile(p);
      setSavedProfile(p);
    }
  }, [user, role]);

  if (!user) return null;

  // Dirty check — true when form differs from last saved
  const isDirty = profile.fullName !== savedProfile.fullName
    || profile.phone !== savedProfile.phone
    || profile.avatar !== savedProfile.avatar;

  // ── AVATAR CHANGE ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarError("");
    const err = await validateAvatarFile(file);
    if (err) {
      setAvatarError(err);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProfile((prev) => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  // ── SAVE PROFILE ──
  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);

    try {
      const res = await fetch(`${BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone:    profile.phone,
          avatar:   profile.avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile.");

      // Persist updated user to sessionStorage
      const updatedUser = {
        ...user,
        fullName: data.user.fullName,
        phone:    data.user.phone,
        avatar:   data.user.avatar,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setSavedProfile({ ...profile });
      // Brief success flash then reload to sync Sidebar
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setSaveError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }, [profile, user]);

  // ── CHANGE PASSWORD ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError("");

    if (!pwdForm.current) { setPwdError("Current password is required."); return; }
    if (!pwdForm.newPwd)   { setPwdError("New password is required."); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdError("Passwords do not match."); return; }

    setPwdSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          email:           user.email,
          password:        pwdForm.newPwd,
          confirmPassword: pwdForm.confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password.");
      setPwdForm({ current: "", newPwd: "", confirm: "" });
      setPwdError("✓ Password updated successfully.");
    } catch (err) {
      setPwdError(err.message || "Something went wrong.");
    } finally {
      setPwdSaving(false);
    }
  };

  const isSuccess = pwdError.startsWith("✓");

  return (
    <div className="dashboard-page">
      <Sidebar user={user} role={role} onLogout={logout} />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <button
              type="button"
              className="settings-back-btn"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft /> Back to Dashboard
            </button>
            <h1>Settings</h1>
            <p>Manage your account and security preferences.</p>
          </div>
        </header>

        {/* ── TABS ── */}
        <div className="settings-tabs">
          {[
            { key: "profile",  label: "My Profile" },
            { key: "security", label: "Security" },
          ].map(t => (
            <button
              key={t.key}
              className={`settings-tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => { setActiveTab(t.key); setSaveError(""); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-content-wrapper fade-in">

          {/* ════ PROFILE TAB ════ */}
          {activeTab === "profile" && (
            <form className="dashboard-card settings-card" onSubmit={handleSave}>
              <div className="card-heading settings-header">
                <div>
                  <h3>Personal Information</h3>
                  <p>Update your photo and personal details.</p>
                </div>
                {isDirty && (
                  <span className="unsaved-badge">Unsaved changes</span>
                )}
              </div>

              <div className="settings-body">
                {/* Avatar */}
                <div className="avatar-upload-block">
                  <div className="avatar-preview-circle" onClick={() => fileInputRef.current?.click()}>
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="avatar-img" />
                    ) : (
                      <span className="avatar-initials">{profile.fullName.charAt(0) || "?"}</span>
                    )}
                    <div className="avatar-overlay"><span>Edit</span></div>
                  </div>
                  <div className="avatar-text">
                    <h4>Profile Picture</h4>
                    <p>PNG, JPG or GIF · max 800×800px · max 2 MB</p>
                    {avatarError && <p className="avatar-error">{avatarError}</p>}
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleAvatarChange}
                    />
                    <button type="button" className="btn-outline" onClick={() => fileInputRef.current?.click()}>
                      Upload new picture
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Editable */}
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      className="settings-input"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input
                      className="settings-input"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* Read-only */}
                  <div className="input-group">
                    <label>Email Address</label>
                    <input className="settings-input readonly" type="email" value={profile.email} disabled />
                    <span className="readonly-hint"><LockIcon /> Cannot be changed</span>
                  </div>
                  <div className="input-group">
                    <label>Role</label>
                    <input
                      className="settings-input readonly"
                      value={ROLE_LABELS[profile.role] || profile.role?.replace("_", " ").toUpperCase() || ""}
                      disabled
                    />
                    <span className="readonly-hint"><LockIcon /> Cannot be changed</span>
                  </div>
                </div>

                {saveError && <p className="save-error">{saveError}</p>}
              </div>

              <div className="settings-footer">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!isDirty || saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* ════ SECURITY TAB ════ */}
          {activeTab === "security" && (
            <form className="dashboard-card settings-card" onSubmit={handlePasswordChange}>
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
                      <input
                        className="settings-input"
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={pwdForm.current}
                        onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>New Password</label>
                    <div className="password-wrapper">
                      <input
                        className="settings-input"
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={pwdForm.newPwd}
                        onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Confirm New Password</label>
                    <div className="password-wrapper">
                      <input
                        className="settings-input"
                        type={showPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={pwdForm.confirm}
                        onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeClosed /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                </div>

                {pwdError && (
                  <p className={isSuccess ? "pwd-success" : "save-error"}>{pwdError}</p>
                )}
              </div>

              <div className="settings-footer">
                <button type="submit" className="btn-primary" disabled={pwdSaving}>
                  {pwdSaving ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}

export default OrgSettings;
