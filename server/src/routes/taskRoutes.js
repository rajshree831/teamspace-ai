// server/src/routes/taskRoutes.js

const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { isMember } = require('../middleware/isMember');

const {
  createTask,
  getTeamTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');

// All routes require a logged-in user first.
router.use(protect);

router.post('/', createTask);

// :id here is the TEAM id, so isMember plugs in directly.
router.get('/team/:id', isMember, getTeamTasks);

router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;