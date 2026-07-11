const Team = require('../models/Team');

// Middleware: checks if req.user is an admin of the team
// specified in the route params (:id).
// Must run AFTER `protect`, since it relies on req.user.
const isAdmin = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Find this user's membership entry inside the team.
    // .toString() converts both ObjectIds to strings for safe comparison
    // since ObjectId === ObjectId does NOT work (reference vs value equality).
    const membership = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only team admins can perform this action' });
    }

    // Attach the team to req so the controller doesn't have
    // to fetch it again from the database.
    req.team = team;
    next();
  } catch (error) {
    console.error('isAdmin middleware error:', error.message);
    res.status(500).json({ message: 'Server error while checking admin status' });
  }
};

module.exports = { isAdmin };