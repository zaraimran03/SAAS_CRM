import { useEffect, useState } from "react";
import "../styles/AddLeadModal.css";

const EMPTY_FORM = { description: "", amount: "", date: "", notes: "" };

export default function AddPurchaseModal({ isOpen, onClose, onSubmit, existingPurchases = [] }) {
  const [forms, setForms] = useState([EMPTY_FORM]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForms([EMPTY_FORM]);
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

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    setForms((previous) => previous.map((form, formIndex) => (
      formIndex === index ? { ...form, [name]: value } : form
    )));
  };

  const addForm = () => setForms((previous) => [...previous, { ...EMPTY_FORM }]);

  const submit = async (event) => {
    event.preventDefault();
    if (forms.some((form) => !form.description.trim() || Number(form.amount) <= 0)) {
      setError("Add a description and a positive amount.");
      return;
    }
    await onSubmit(forms.map((form) => ({
      description: form.description.trim(),
      amount: Number(form.amount),
      date: form.date || null,
      notes: form.notes.trim(),
    })));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="lead-modal-header">
          <h3>Purchased Items</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={submit} noValidate>
          {existingPurchases.length > 0 && (
            <div className="purchase-history">
              <h4>Previous purchases</h4>
              {existingPurchases.map((purchase, index) => (
                <div className="purchase-history-row" key={purchase._id || `${purchase.description}-${index}`}>
                  <span>{purchase.description}</span>
                  <strong>${Number(purchase.amount || 0).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="lead-modal-grid">
            {forms.map((form, index) => (
              <div className="purchase-entry" key={index}>
                <div className="purchase-entry-heading">New purchase {index + 1}</div>
                <div className="lead-field lead-field-full">
                  <label>Purchase Description</label>
                  <input name="description" value={form.description} onChange={(event) => handleChange(index, event)} placeholder="e.g. Annual subscription" />
                </div>
                <div className="lead-field">
                  <label>Amount</label>
                  <input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={(event) => handleChange(index, event)} placeholder="e.g. 2500" />
                </div>
                <div className="lead-field">
                  <label>Date</label>
                  <input type="date" name="date" value={form.date} onChange={(event) => handleChange(index, event)} />
                </div>
                <div className="lead-field lead-field-full">
                  <label>Notes <span className="field-optional">(optional)</span></label>
                  <textarea className="purchase-notes-input" name="notes" value={form.notes} onChange={(event) => handleChange(index, event)} rows="2" placeholder="Additional purchase details" />
                </div>
              </div>
            ))}
          </div>
          {error && <span className="field-error">{error}</span>}
          <button type="button" className="purchase-add-row" onClick={addForm}>+ Add another purchase</button>
          <div className="lead-modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="add-lead-btn">Add Purchase</button>
          </div>
        </form>
      </div>
    </div>
  );
}
