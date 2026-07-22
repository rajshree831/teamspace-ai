// client/src/api/tasks.js

import axiosInstance from './axiosInstance';

// Create a new task in a given team.
// Backend: POST /api/tasks
export const createTask = async (taskData) => {
  const response = await axiosInstance.post('/tasks', taskData);
  return response.data;
};

// Get all tasks belonging to a specific team.
// Backend: GET /api/tasks/team/:id
export const getTeamTasks = async (teamId) => {
  const response = await axiosInstance.get(`/tasks/team/${teamId}`);
  return response.data;
};

// Update a task's editable fields (title, description, priority, assignedTo).
// Backend: PUT /api/tasks/:id
export const updateTask = async (taskId, updates) => {
  const response = await axiosInstance.put(`/tasks/${taskId}`, updates);
  return response.data;
};

// Change only a task's status (used by the Kanban column buttons).
// Backend: PATCH /api/tasks/:id/status
export const updateTaskStatus = async (taskId, status) => {
  const response = await axiosInstance.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

// Delete a task. Backend enforces creator-or-admin check; frontend just calls it.
// Backend: DELETE /api/tasks/:id
export const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(`/tasks/${taskId}`);
  return response.data;
};