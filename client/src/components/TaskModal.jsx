// client/src/components/TaskModal.jsx

import { useState, useEffect } from 'react';
import './TaskModal.css';

// taskToEdit: null when creating a new task, or an existing task object when editing.
// teamMembers: array of { user: { _id, name, email }, role } from the team detail data.
// onClose: called to dismiss the modal without saving.
// onSubmit: called with the form data when the user saves.
const TaskModal = ({ taskToEdit, teamMembers, onClose, onSubmit }) => {
  const isEditMode = Boolean(taskToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // When editing, pre-fill the form with the existing task's values.
  // Runs whenever taskToEdit changes (e.g., user clicks Edit on a different card
  // while a modal is somehow already mounted).
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setAssignedTo(taskToEdit.assignedTo?._id || '');
    }
  }, [taskToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title,
        description,
        priority,
        assignedTo: assignedTo || null,
      });
      // Parent (KanbanBoard) is responsible for closing the modal on success -
      // we don't call onClose() here, so the parent stays in control.
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Clicking the dark overlay closes the modal; clicking inside the card does not
    // (stopPropagation prevents the click from bubbling up to the overlay).
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{isEditMode ? 'Edit Task' : 'Create Task'}</h2>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="modal-label">Title</label>
          <input
            type="text"
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix login bug"
          />

          <label className="modal-label">Description</label>
          <textarea
            className="modal-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details..."
          />

          <label className="modal-label">Priority</label>
          <select
            className="modal-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label className="modal-label">Assign To</label>
          <select
            className="modal-select"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.name}
              </option>
            ))}
          </select>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;