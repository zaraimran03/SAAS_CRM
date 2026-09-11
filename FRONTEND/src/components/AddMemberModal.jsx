import { useEffect, useState } from "react";

const ROLE_OPTIONS = ["org_admin", "sales_manager", "sales_rep", "viewer"];
const ROLE_LABELS = {
  org_admin: "Admin",
  sales_manager: "Manager",
  sales_rep: "Sales Member",
  viewer: "Viewer",
};

const EMPTY_FORM = { fullName: "", email: "", role: "sales_rep" };

function AddMemberModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setError("");
    document.body.style.overflow = "hidden";
    const handleKey = (event) => event.key === "Escape" && onClose();
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
    try {
      await onSubmit({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), role: form.role });
    } catch (submitError) {
      setError(submitError.message || "Failed to invite member.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="lead-modal-header">
          <h3>Add Member</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="lead-modal-grid">
            <div className="lead-field lead-field-full">
              <label>Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g. Zara Imran" />
            </div>
            <div className="lead-field lead-field-full">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="e.g. zara@example.com" />
            </div>
            <div className="lead-field lead-field-full">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
            </div>
            {error && <span className="field-error lead-field-full">{error}</span>}
          </div>
          <div className="lead-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="add-lead-btn">Send Invitation</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberModal;
