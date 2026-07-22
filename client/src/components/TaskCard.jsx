// client/src/components/TaskCard.jsx

import './TaskCard.css';

// COLUMNS duplicated here intentionally for now (small, static list) -
// avoids an awkward prop just to pass 3 fixed values down.
const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

// TaskCard is a "presentational" component: it receives data and callbacks
// as props, and has no knowledge of the API or global board state.
// canDelete is computed by the parent (KanbanBoard) since it needs both
// the current user's identity and the team's member/role list to decide.
const TaskCard = ({ task, onStatusChange, onEdit, onDelete, canDelete }) => {
  return (
    <div className="task-card">
      <div className="task-card-header">
        <p className="task-title">{task.title}</p>
        {task.isAIGenerated && <span className="ai-badge">AI</span>}
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className={`priority-badge priority-${task.priority}`}>
          {task.priority}
        </span>
        {task.assignedTo && (
          <span className="assignee-name">{task.assignedTo.name}</span>
        )}
      </div>

      <div className="task-status-buttons">
        {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
          <button key={c.key} onClick={() => onStatusChange(task._id, c.key)}>
            Move to {c.label}
          </button>
        ))}

        <button className="edit-btn" onClick={() => onEdit(task)}>
          Edit
        </button>

        {/* Only rendered when the current user is the creator or a team admin.
            Backend still enforces this independently - this is UX only. */}
        {canDelete && (
          <button className="delete-btn" onClick={() => onDelete(task._id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;