const mongoose = require('mongoose');
const Team = require('../models/Team');

// Middleware: checks if req.user belongs to the team in :id (any role).
// Used for routes where any team member (not just admins) should have access.
const isMember = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid team ID' });
    }

    const team = await Team.findById(req.params.id);

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