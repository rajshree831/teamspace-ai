// meetingRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {isMember }= require('../middleware/isMember');
const {
  createMeeting,
  getTeamMeetings,
  getMeetingById,
  analyzeMeeting,
  bulkCreateTasksFromMeeting
} = require('../controllers/meetingController');

router.post('/', protect, isMember, createMeeting);
router.get('/team/:teamId', protect, isMember, getTeamMeetings);
router.get('/:id', protect, getMeetingById);
router.post('/:id/analyze', protect, analyzeMeeting);
router.post('/:id/tasks', protect, bulkCreateTasksFromMeeting);

module.exports = router;