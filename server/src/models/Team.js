const mongoose = require('mongoose');

// Sub-schema for a single team membership.
// We don't give this its own _id lookup pattern since it's
// always accessed through the parent Team document.
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'], // restricts value to these two only
      default: 'member',
    },
  },
  { _id: false } // no need for a separate id per membership entry
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);