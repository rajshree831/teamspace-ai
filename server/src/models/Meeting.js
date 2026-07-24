const mongoose = require('mongoose');

// Sub-schema for a single AI-extracted task suggestion.
// This is intentionally NOT a ref to the Task model — it's a proposal,
// not a committed task. It only becomes a real Task after admin review.
const extractedTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    // Plain text name pulled from the transcript by the AI.
    // Not validated against real team members here — that mapping
    // happens later in the frontend Review Screen.
    suggestedAssignee: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true } // each extracted task gets its own _id so the frontend
                // can reference a specific one during accept/edit/reject
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    transcript: {
      type: String,
      required: [true, 'Transcript text is required'],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Populated only after a successful AI analyze call
    aiSummary: {
      type: String,
      default: '',
    },
    aiKeyPoints: {
      type: [String],
      default: [],
    },
    aiExtractedTasks: {
      type: [extractedTaskSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'processed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);