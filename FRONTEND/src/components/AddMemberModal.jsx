import { useEffect, useState } from "react";

const ROLE_OPTIONS = ["org_admin", "sales_manager", "sales_rep", "viewer"];
const ROLE_LABELS = {
  org_admin: "Admin",
  sales_manager: "Manager",
  sales_rep: "Sales Member",
  viewer: "Viewer",
};
const ROLE_DESCRIPTIONS = {
  org_admin: "Full access — can manage members, settings & all data.",
  sales_manager: "Can manage leads, deals, customers & view reports.",
  sales_rep: "Can manage assigned leads, deals & activities.",
  viewer: "Read-only access to CRM data.",
};

const EMPTY_FORM = { fullName: "", email: "", role: "sales_rep" };

function AddMemberModal({ isOpen, onClose, onSubmit, canAssignAdmin = false }) {
  const roleOptions = canAssignAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((role) => role !== "org_admin");
  const [form, setForm] = useState({ ...EMPTY_FORM, role: roleOptions[0] || "sales_rep" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...EMPTY_FORM, role: roleOptions[0] || "sales_rep" });
    setError("");
    setLoading(false);
    document.body.style.overflow = "hidden";
    const handleKey = (event) => event.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim()) return setError("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Enter a valid email address.");
    setLoading(true);
    setError("");
    try {
      await onSubmit({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), role: form.role });
    } catch (submitError) {
      setError(submitError.message || "Failed to invite member.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={!loading ? onClose : undefined}>
      <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="add-member-title" onClick={(event) => event.stopPropagation()}>
        <div className="lead-modal-header">
          <h3 id="add-member-title">Invite Member</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close" disabled={loading}>×</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="lead-modal-grid">
            <div className="lead-field lead-field-full">
              <label htmlFor="member-fullName">Full Name</label>
              <input
                id="member-fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Zara Imran"
                disabled={loading}
                autoComplete="name"
              />
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="member-email">Email Address</label>
              <input
                id="member-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. zara@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="lead-field lead-field-full">
              <label htmlFor="member-role">Role</label>
              <select id="member-role" name="role" value={form.role} onChange={handleChange} disabled={loading}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
              {form.role && (
                <span style={{ fontSize: "11px", color: "var(--leads-muted)", marginTop: "4px", display: "block" }}>
                  {ROLE_DESCRIPTIONS[form.role]}
                </span>
              )}
            </div>
            {error && <span className="field-error lead-field-full">{error}</span>}
          </div>
          <div className="lead-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="add-lead-btn" disabled={loading}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="lead-loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Sending…
                </span>
              ) : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberModal;
