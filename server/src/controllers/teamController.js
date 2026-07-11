const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (any logged-in user)
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Basic validation — Mongoose will also validate,
    // but failing fast here gives a cleaner error message.
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Team name is required' });
    }

    // Create the team, auto-adding the creator as admin.
    const team = await Team.create({
      name,
      description,
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
        },
      ],
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error.message);
    res.status(500).json({ message: 'Server error while creating team' });
  }
};

// @desc    Get all teams the logged-in user belongs to
// @route   GET /api/teams/my
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    // Find teams where the members array contains an entry
    // with user matching the logged-in user's id
    const teams = await Team.find({ 'members.user': req.user._id })
      .sort({ createdAt: -1 }); // newest teams first

    res.status(200).json(teams);
  } catch (error) {
    console.error('Get my teams error:', error.message);
    res.status(500).json({ message: 'Server error while fetching teams' });
  }
};

// @desc    Add a member to a team by email
// @route   POST /api/teams/:id/members
// @access  Private (admin only)
const addMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }

    // req.team was attached by the isAdmin middleware —
    // no need to query the database again for the team.
    const team = req.team;

    // The user being added must already be registered.
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });

    if (!userToAdd) {
      return res.status(404).json({ message: 'No registered user found with this email' });
    }

    // Prevent adding someone who's already a member.
    const alreadyMember = team.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    // Add as a regular member (admins are only created via team creation, for now).
    team.members.push({ user: userToAdd._id, role: 'member' });
    await team.save();

    // Re-fetch with population so the response has full name/email data,
    // matching the shape of GET /api/teams/:id. Without this, .save()
    // returns raw ObjectIds for members.user, which breaks the frontend
    // since it expects { _id, name, email } objects to render immediately.
    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json(populatedTeam);
  } catch (error) {
    console.error('Add member error:', error.message);
    res.status(500).json({ message: 'Server error while adding member' });
  }
};

// @desc    Get details of a single team (with populated member info)
// @route   GET /api/teams/:id
// @access  Private (team members only)
const getTeamById = async (req, res) => {
  try {
    // Re-fetch with population — req.team from middleware has raw ObjectIds only.
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'name email') // only pull name + email, not password
      .populate('createdBy', 'name email');

    res.status(200).json(team);
  } catch (error) {
    console.error('Get team by id error:', error.message);
    res.status(500).json({ message: 'Server error while fetching team' });
  }
};

module.exports = { createTeam, getMyTeams, addMember, getTeamById };