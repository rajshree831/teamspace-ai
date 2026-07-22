// client/src/pages/kanban/KanbanBoard.jsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getTeamTasks,
  updateTaskStatus,
  createTask,
  updateTask,
  deleteTask,
} from '../../api/tasks';
import { getTeamById } from '../../api/teams';
import { useAuth } from '../../context/AuthContext';
import TaskCard from '../../components/TaskCard';
import TaskModal from '../../components/TaskModal';
import './KanbanBoard.css';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const KanbanBoard = () => {
  const { id: teamId } = useParams();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state: controls whether it's shown, and whether we're editing
  // an existing task (taskToEdit set) or creating a new one (taskToEdit null).
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Fetch both the team's tasks AND its member list on load.
  // Members are needed for the modal's assignee dropdown AND to determine
  // whether the current user is an admin (for delete permissions).
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, teamData] = await Promise.all([
          getTeamTasks(teamId),
          getTeamById(teamId),
        ]);
        setTasks(tasksData);
        setTeamMembers(teamData.members);
      } catch (err) {
        console.error('Failed to load board:', err);
        setError('Could not load the board. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  // Determine if the logged-in user is an admin of this team.
  // Used to decide whether the Delete button should be shown on each card.
  const isCurrentUserAdmin = teamMembers.some(
    (m) => m.user._id === user._id && m.role === 'admin'
  );

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Could not update task status. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm('Delete this task? This cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteTask(taskId);
      // Remove the deleted task from local state - no need to re-fetch everything.
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert(err.response?.data?.message || 'Could not delete task. Please try again.');
    }
  };

  // Opens the modal in "create" mode.
  const openCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // Opens the modal in "edit" mode, pre-filled with the clicked task.
  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  // Passed to TaskModal as `onSubmit`. Decides create vs edit based on
  // whether taskToEdit is set, then updates local state accordingly.
  const handleModalSubmit = async (formData) => {
    if (taskToEdit) {
      // Edit mode
      const updated = await updateTask(taskToEdit._id, formData);
      setTasks((prev) =>
        prev.map((task) => (task._id === updated._id ? updated : task))
      );
    } else {
      // Create mode - team must be included, since the backend requires it
      const created = await createTask({ ...formData, team: teamId });
      setTasks((prev) => [...prev, created]);
    }
    closeModal();
  };

  if (loading) return <p className="kanban-status-message">Loading tasks...</p>;
  if (error) return <p className="kanban-status-message kanban-error">{error}</p>;

  return (
    <div>
      <div className="kanban-header">
        <button className="btn-primary" onClick={openCreateModal}>
          + Add Task
        </button>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);

          return (
            <div key={column.key} className="kanban-column">
              <h3 className="kanban-column-title">
                {column.label} <span className="kanban-count">({columnTasks.length})</span>
              </h3>

              <div className="kanban-column-body">
                {columnTasks.length === 0 && (
                  <p className="kanban-empty">No tasks here yet</p>
                )}

                {columnTasks.map((task) => {
                  // A task can be deleted by its creator OR any team admin.
                  const canDelete =
                    isCurrentUserAdmin || task.createdBy._id === user._id;

                  return (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={openEditModal}
                      onDelete={handleDeleteTask}
                      canDelete={canDelete}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <TaskModal
          taskToEdit={taskToEdit}
          teamMembers={teamMembers}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default KanbanBoard;