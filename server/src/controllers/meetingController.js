const Meeting = require('../models/Meeting');
const Team = require('../models/Team');
const Task = require('../models/Task');
const { analyzeTranscript, AIAnalysisError } = require('../services/aiService');

// @desc    Save a new meeting transcript
// @route   POST /api/meetings
// @access  Any team member (isMember middleware checked at route level)
const createMeeting = async (req, res) => {
  try {
    const { title, transcript, team } = req.body;

    if (!title || !transcript || !team) {
      return res.status(400).json({
        message: 'Title, transcript, and team are required',
      });
    }

    const meeting = await Meeting.create({
      title,
      transcript,
      team,
      createdBy: req.user._id, // always trust the token, never the body
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Create meeting error:', error.message);
    res.status(500).json({ message: 'Failed to create meeting' });
  }
};

// @desc    Get meeting history for a team
// @route   GET /api/meetings/team/:teamId
// @access  Team members only
const getTeamMeetings = async (req, res) => {
  try {
    const { teamId } = req.params;

    const meetings = await Meeting.find({ team: teamId })
      .select('title status createdBy createdAt')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error('Get team meetings error:', error.message);
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
};

// @desc    Get a single meeting's full detail
// @route   GET /api/meetings/:id
// @access  Team members only
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const team = await Team.findById(meeting.team);

    if (!team) {
      return res.status(404).json({ message: 'Associated team not found' });
    }

    const isPartOfTeam = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isPartOfTeam) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    res.status(200).json(meeting);
  } catch (error) {
    console.error('Get meeting by id error:', error.message);
    res.status(500).json({ message: 'Failed to fetch meeting' });
  }
};

// @desc    Trigger AI analysis of a meeting's transcript
//          (summary + key points + extracted tasks, single API call)
// @route   POST /api/meetings/:id/analyze
// @access  Team members only
const analyzeMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const team = await Team.findById(meeting.team);

    if (!team) {
      return res.status(404).json({ message: 'Associated team not found' });
    }

    const isPartOfTeam = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isPartOfTeam) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    // Idempotency guard — don't re-spend an AI call on an already-processed meeting.
    if (meeting.status === 'processed') {
      return res.status(200).json({
        message: 'Meeting was already analyzed',
        summary: meeting.aiSummary,
        keyPoints: meeting.aiKeyPoints,
        tasks: meeting.aiExtractedTasks,
      });
    }

    // Controller only talks to the service layer, never to Gemini directly.
    const result = await analyzeTranscript(meeting.transcript);

    meeting.aiSummary = result.summary;
    meeting.aiKeyPoints = result.keyPoints;
    meeting.aiExtractedTasks = result.tasks;
    meeting.status = 'processed';
    await meeting.save();

    res.status(200).json({
      message: 'Meeting analyzed successfully',
      summary: meeting.aiSummary,
      keyPoints: meeting.aiKeyPoints,
      tasks: meeting.aiExtractedTasks,
    });
  } catch (error) {
    // AI/parsing failures are the AI's fault, not the server's -> 422, not 500.
    if (error instanceof AIAnalysisError) {
      return res.status(422).json({ message: error.message });
    }
    console.error('Analyze meeting error:', error.message);
    res.status(500).json({ message: 'Failed to analyze meeting' });
  }
};
// @desc    Bulk-create real Kanban tasks from accepted AI-extracted tasks
// @route   POST /api/meetings/:id/tasks
// @access  Team admin only (matches "Admin Reviews" in the product spec)
const bulkCreateTasksFromMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
 
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
 
    const team = await Team.findById(meeting.team);
 
    if (!team) {
      return res.status(404).json({ message: 'Associated team not found' });
    }
 
    // Inline admin check — done here rather than via isAdmin middleware,
    // because that middleware expects the TEAM id in req.params.id,
    // but this route's :id is the MEETING id. Reusing it directly would
    // check the wrong document (same class of bug we just fixed in isMember).
    const membership = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
 
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
 
    if (membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only a team admin can add tasks to the board' });
    }
 
    const { tasks } = req.body;
 
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'No accepted tasks were provided' });
    }
 
    // Collect valid member user IDs once, so we can validate each
    // assignedTo without hitting the DB once per task.
    const validMemberIds = new Set(team.members.map((m) => m.user.toString()));
 
    const tasksToInsert = [];
 
    for (const t of tasks) {
      if (!t.title || typeof t.title !== 'string' || t.title.trim() === '') {
        return res.status(400).json({ message: 'Every task must have a title' });
      }
 
      // assignedTo is optional (AI may not have found a clear assignee).
      // If provided, it must actually be a member of this team.
      if (t.assignedTo && !validMemberIds.has(t.assignedTo.toString())) {
        return res.status(400).json({
          message: `assignedTo "${t.assignedTo}" is not a member of this team`,
        });
      }
 
      tasksToInsert.push({
        title: t.title.trim(),
        description: t.description || '',
        priority: t.priority || 'medium',
        assignedTo: t.assignedTo || null,
        status: 'todo', // new tasks always start in the first column
        team: team._id,
        createdBy: req.user._id,
        isAIGenerated: true,
      });
    }
 
    const createdTasks = await Task.insertMany(tasksToInsert);
 
    res.status(201).json(createdTasks);
  } catch (error) {
    console.error('Bulk create tasks from meeting error:', error.message);
    res.status(500).json({ message: 'Failed to add tasks to the board' });
  }
};
 

module.exports = {
  createMeeting,
  getTeamMeetings,
  getMeetingById,
  analyzeMeeting,
  bulkCreateTasksFromMeeting
};