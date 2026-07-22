// server/src/controllers/taskController.js

const Task = require('../models/Task');
const Team = require('../models/Team');

// Small reusable helper: checks if a userId belongs to a team's members array.
// Not exported - internal helper used only within this controller.
const isTeamMember = (team, userId) => {
  return team.members.some((m) => m.user.toString() === userId.toString());
};

// Small reusable helper: checks if a userId is an admin of the team.
const isTeamAdmin = (team, userId) => {
  const membership = team.members.find((m) => m.user.toString() === userId.toString());
  return membership && membership.role === 'admin';
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Any team member
const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, team: teamId } = req.body;

    if (!title || !teamId) {
      return res.status(400).json({ message: 'Title and team are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Manual membership check - teamId comes from the body, not route params,
    // so the isMember middleware can't be used here.
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    // If an assignee is provided, they must also belong to this team.
    // Prevents assigning tasks to outsiders.
    if (assignedTo && !isTeamMember(team, assignedTo)) {
      return res.status(400).json({ message: 'Assignee must be a member of this team' });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo: assignedTo || null,
      team: teamId,
      createdBy: req.user._id,
    });

    // Re-fetch with population so the frontend gets full user objects,
    // not just raw ObjectIds - same pattern you used for Team creation.
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('createTask error:', error.message); cv
    res.status(500).json({ message: 'Server error while creating task' });
  }
};

// @desc    Get all tasks for a team
// @route   GET /api/tasks/team/:id
// @access  Any team member (protected by isMember middleware at route level)
const getTeamTasks = async (req, res) => {
  try {
    // req.team is already attached by the isMember middleware -
    // no need to re-fetch or re-check membership here.
    const tasks = await Task.find({ team: req.params.id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json(tasks);
  } catch (error) {
    console.error('getTeamTasks error:', error.message);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// @desc    Edit a task's details
// @route   PUT /api/tasks/:id
// @access  Any team member
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const team = await Team.findById(task.team);
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    const { title, description, priority, assignedTo } = req.body;

    // If assignee is being changed, validate they're a team member.
    if (assignedTo && !isTeamMember(team, assignedTo)) {
      return res.status(400).json({ message: 'Assignee must be a member of this team' });
    }

    // Only update fields that were actually provided in the request.
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json(populatedTask);
  } catch (error) {
    console.error('updateTask error:', error.message);
    res.status(500).json({ message: 'Server error while updating task' });
  }
};

// @desc    Change a task's status (move between Kanban columns)
// @route   PATCH /api/tasks/:id/status
// @access  Any team member
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'inprogress', 'done'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const team = await Team.findById(task.team);
    if (!isTeamMember(team, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    task.status = status;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.error('updateTaskStatus error:', error.message);
    res.status(500).json({ message: 'Server error while updating task status' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Task creator OR team admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const team = await Team.findById(task.team);

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAdminOfTeam = isTeamAdmin(team, req.user._id);

    // Delete allowed only if the requester created this task OR is a team admin.
    if (!isCreator && !isAdminOfTeam) {
      return res.status(403).json({
        message: 'Only the task creator or a team admin can delete this task',
      });
    }

    await task.deleteOne();

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('deleteTask error:', error.message);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
};

module.exports = {
  createTask,
  getTeamTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
};