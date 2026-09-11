import { useEffect, useState } from "react";

const TYPE_OPTIONS = ["Call", "Email", "Meeting", "Note", "Follow-up"];

const EMPTY_FORM = {
  type: "Call",
  title: "",
  relatedTo: "",
  date: "",
  notes: "",
  owner: "",
};

function AddActivityModal({ isOpen, onClose, onSubmit, showOwner, activityToEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setForm(activityToEdit ? {
      ...EMPTY_FORM,
      ...activityToEdit,
      title: activityToEdit.title || activityToEdit.notes || "",
      relatedTo: activityToEdit.relatedTo || activityToEdit.contact || "",
      date: activityToEdit.date ? String(activityToEdit.date).slice(0, 10) : "",
    } : EMPTY_FORM);
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
    if (!form.title.trim()) nextErrors.title = "Activity title is required";
    if (!form.relatedTo.trim()) nextErrors.relatedTo = "Related entity is required";
    if (!form.date) nextErrors.date = "Date is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type: form.type,
      title: form.title.trim(),
      relatedTo: form.relatedTo.trim(),
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
              <label>Activity Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Discussed pricing"
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="lead-field lead-field-full">
              <label>Related To</label>
              <input
                type="text"
                name="relatedTo"
                placeholder="e.g. Zara Imran, Acme Inc., or Enterprise Deal"
                value={form.relatedTo}
                onChange={handleChange}
              />
              {errors.relatedTo && <span className="field-error">{errors.relatedTo}</span>}
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
