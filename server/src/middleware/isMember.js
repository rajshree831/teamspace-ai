const mongoose = require('mongoose');
const Team = require('../models/Team');

// Middleware: checks if req.user belongs to the team (any role).
// Accepts the team id from params.id (existing task routes),
// params.teamId, or body.team (new meeting routes) — checked in that order.
const isMember = async (req, res, next) => {
  try {
    const teamId = req.params.id || req.params.teamId || req.body.team;

    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isPartOfTeam = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isPartOfTeam) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    req.team = team;
    next();
  } catch (error) {
    console.error('isMember middleware error:', error.message);
    res.status(500).json({ message: 'Server error while checking membership' });
  }
};

module.exports = { isMember };