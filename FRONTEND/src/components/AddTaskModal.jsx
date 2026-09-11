import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["To Do", "In Progress", "Review", "Done", "Cancelled"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const TYPE_OPTIONS = ["Call", "Email", "Meeting", "Follow-up", "General"];

const EMPTY_FORM = {
  title: "",
  description: "",
  relatedTo: "",
  assignee: "",
  type: "General",
  priority: "Medium",
  status: "To Do",
  dueDate: "",
};

function AddTaskModal({ isOpen, onClose, onSubmit, showAssignee, taskToEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setForm(taskToEdit ? {
      ...EMPTY_FORM,
      ...taskToEdit,
      dueDate: taskToEdit.dueDate ? String(taskToEdit.dueDate).slice(0, 10) : "",
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
  }, [isOpen, onClose, taskToEdit]);

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
    if (!form.title.trim()) nextErrors.title = "Title is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      relatedTo: form.relatedTo.trim(),
      assignee: form.assignee.trim(),
      type: form.type,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="lead-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lead-modal-header">
          <h3 id="task-modal-title">{taskToEdit ? "Edit Task" : "Create New Task"}</h3>
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
            <div className="lead-field lead-field-full">
              <label>Task Title</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Follow up with Acme Inc."
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="lead-field lead-field-full">
              <label>Related To <span className="field-optional">(optional)</span></label>
              <input
                type="text"
                name="relatedTo"
                placeholder="e.g. Zara Imran, Acme Inc., or Enterprise Deal"
                value={form.relatedTo}
                onChange={handleChange}
              />
            </div>

            <div className="lead-field">
              <label>Task Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                {TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="lead-field">
              <label>Description <span className="field-optional">(optional)</span></label>
              <input
                type="text"
                name="description"
                placeholder="Brief description of the task..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="lead-field">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="lead-field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="lead-field">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            {showAssignee && (
              <div className="lead-field">
                <label>Assignee <span className="field-optional">(optional)</span></label>
                <input
                  type="text"
                  name="assignee"
                  placeholder="e.g. Alex Kim"
                  value={form.assignee}
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
              {taskToEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
