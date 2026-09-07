import { useEffect, useState } from "react";
import { DEAL_STAGES } from "../config/dealsConfig";
import "../styles/AddLeadModal.css";

const EMPTY_FORM = {
  title:       "",
  company:     "",
  contact:     "",
  email:       "",
  value:       "",
  stage:       "Qualification",
    status:      "Active",
  owner:       "",
  closeDate:   "",
  description: "",
  probability: "",
  linkedCustomer: "",
  linkedLead: "",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

function AddDealModal({ isOpen, onClose, onSubmit, showOwner, editingDeal }) {

  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch leads and customers for dropdowns
    fetch(`${API_URL}/customers`, { headers: authHeader() })
      .then(res => res.json())
      .then(data => data.success && setCustomers(data.customers))
      .catch(err => console.error(err));

    fetch(`${API_URL}/leads`, { headers: authHeader() })
      .then(res => res.json())
      .then(data => data.success && setLeads(data.leads))
      .catch(err => console.error(err));

    setForm(
      editingDeal
        ? {
            title:       editingDeal.title       || "",
            company:     editingDeal.company     || "",
            contact:     editingDeal.contact     || "",
            email:       editingDeal.email       || "",
            value:       editingDeal.value?.replace("$", "").replace(/,/g, "") || "",
            stage:       editingDeal.stage       || "Qualification",
                        status:      editingDeal.status      || "Active",
            owner:       editingDeal.owner       || "",
            closeDate:   editingDeal.closeDate   || "",
            description: editingDeal.description || "",
            probability: editingDeal.probability || "",
            linkedCustomer: editingDeal.linkedCustomer || "",
            linkedLead: editingDeal.linkedLead || "",
          }
        : EMPTY_FORM
    );
    setErrors({});

    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, editingDeal, onClose]);

  if (!isOpen) return null;

  // ====================================================
  // Handlers
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())   errs.title   = "Deal title is required";
    if (!form.company.trim()) errs.company  = "Company is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const numericValue = Number(form.value.replace(/[^0-9.]/g, "")) || 0;
    const numProb = Number(form.probability) || 0;

    setSaving(true);
    try {
      await onSubmit({
        title:       form.title.trim(),
        company:     form.company.trim(),
        contact:     form.contact.trim(),
        email:       form.email.trim().toLowerCase(),
        value:       `$${numericValue.toLocaleString()}`,
        stage:       form.stage,
        status:      form.status,
        owner:       form.owner.trim(),
        closeDate:   form.closeDate,
        description: form.description.trim(),
        probability: numProb,
        linkedCustomer: form.linkedCustomer || null,
        linkedLead: form.linkedLead || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(editingDeal?._id);

  // ====================================================
  // Render
  // ====================================================

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="lead-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-modal-title"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="lead-modal-header">
          <h3 id="deal-modal-title">
            {isEditing ? "Edit Deal" : "Add New Deal"}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="lead-modal-grid">

            {/* Title */}
            <div className="lead-field lead-field-full">
              <label>Deal Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Acme Enterprise Licence"
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            {/* Company */}
            <div className="lead-field">
              <label>Company Name</label>
              <input
                type="text"
                name="company"
                placeholder="e.g. Acme Inc."
                value={form.company}
                onChange={handleChange}
              />
              {errors.company && <span className="field-error">{errors.company}</span>}
            </div>

            {/* Contact person */}
            <div className="lead-field">
              <label>Contact Person <span className="field-optional">(optional)</span></label>
              <input
                type="text"
                name="contact"
                placeholder="e.g. John Doe"
                value={form.contact}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="lead-field">
              <label>Email <span className="field-optional">(optional)</span></label>
              <input
                type="email"
                name="email"
                placeholder="e.g. john@acme.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Value */}
            <div className="lead-field">
              <label>Deal Value <span className="field-optional">(optional)</span></label>
              <input
                type="text"
                name="value"
                placeholder="e.g. 25000"
                value={form.value}
                onChange={handleChange}
              />
            </div>

            {/* Stage */}
            <div className="lead-field">
              <label>Stage</label>
              <select name="stage" value={form.stage} onChange={handleChange}>
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="lead-field">
              <label>Deal Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Close Date */}
            <div className="lead-field">
              <label>Expected Close Date <span className="field-optional">(optional)</span></label>
              <input
                type="date"
                name="closeDate"
                value={form.closeDate}
                onChange={handleChange}
              />
            </div>

            {/* Owner */}
            {showOwner && (
              <div className="lead-field">
                <label>Owner <span className="field-optional">(optional)</span></label>
                <input
                  type="text"
                  name="owner"
                  placeholder="e.g. Alex Kim"
                  value={form.owner}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Probability */}
            <div className="lead-field">
              <label>Probability (%) <span className="field-optional">(optional)</span></label>
              <input
                type="number"
                name="probability"
                min="0"
                max="100"
                placeholder="e.g. 50"
                value={form.probability}
                onChange={handleChange}
              />
            </div>

            {/* Linked Customer */}
            <div className="lead-field">
              <label>Link to Customer <span className="field-optional">(optional)</span></label>
              <select name="linkedCustomer" value={form.linkedCustomer} onChange={handleChange}>
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name || c.company}</option>
                ))}
              </select>
            </div>

            {/* Linked Lead */}
            <div className="lead-field">
              <label>Link to Lead <span className="field-optional">(optional)</span></label>
              <select name="linkedLead" value={form.linkedLead} onChange={handleChange}>
                <option value="">-- Select Lead --</option>
                {leads.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="lead-field lead-field-full">
              <label>Description <span className="field-optional">(optional)</span></label>
              <textarea
                name="description"
                rows={3}
                placeholder="Brief description of the deal..."
                value={form.description}
                onChange={handleChange}
                style={{
                  resize: "vertical",
                  minHeight: "72px",
                  padding: "10px 12px",
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  color: "#374151",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>

          </div>

          {/* ACTIONS */}
          <div className="lead-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-lead-btn" disabled={saving}>
              {saving
                ? isEditing ? "Saving..." : "Adding..."
                : isEditing ? "Save Changes" : "Add Deal"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default AddDealModal;
