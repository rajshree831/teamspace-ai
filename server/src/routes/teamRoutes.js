const express = require('express');
const router = express.Router();
const { createTeam, getMyTeams, addMember,getTeamById } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/isAdmin');
const { isMember } = require('../middleware/isMember');



router.post('/', protect, createTeam);
router.get('/my', protect, getMyTeams);
router.post('/:id/members', protect, isAdmin, addMember);
router.get('/:id', protect, isMember, getTeamById);

module.exports = router;