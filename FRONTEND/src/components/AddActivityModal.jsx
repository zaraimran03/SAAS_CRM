import { useEffect, useState } from "react";

const TYPE_OPTIONS = ["Call", "Email", "Meeting"];

const EMPTY_FORM = {
  type: "Call",
  contact: "",
  date: "",
  notes: "",
  owner: "",
};

function AddActivityModal({ isOpen, onClose, onSubmit, showOwner, activityToEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setForm(activityToEdit || EMPTY_FORM);
    setErrors({});

    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, activityToEdit]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.contact.trim()) nextErrors.contact = "Contact is required";
    if (!form.date) nextErrors.date = "Date is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type: form.type,
      contact: form.contact.trim(),
      date: form.date,
      notes: form.notes.trim(),
      owner: form.owner.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="lead-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lead-modal-header">
          <h3 id="activity-modal-title">{activityToEdit ? "Edit Activity" : "Log New Activity"}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="lead-modal-grid">
            <div className="lead-field">
              <label>Activity Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="lead-field">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            <div className="lead-field lead-field-full">
              <label>Contact Name</label>
              <input
                type="text"
                name="contact"
                placeholder="e.g. John Doe"
                value={form.contact}
                onChange={handleChange}
              />
              {errors.contact && <span className="field-error">{errors.contact}</span>}
            </div>

            <div className="lead-field lead-field-full">
              <label>Notes <span className="field-optional">(optional)</span></label>
              <input
                type="text"
                name="notes"
                placeholder="Brief notes about the activity..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            {showOwner && (
              <div className="lead-field lead-field-full">
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
          </div>

          <div className="lead-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-lead-btn">
              {activityToEdit ? "Save Changes" : "Log Activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddActivityModal;
