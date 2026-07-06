const mongoose = require('mongoose');

const candidateIntakeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  fullName: { type: String, required: true },

  jobSearchStatus:      { type: String, default: '' },
  jobSearchStatusOther: { type: String, default: '' },

  searchDuration:      { type: String, required: true },
  searchDurationOther: { type: String, default: '' },

  platformsUsed:              { type: String, required: true },
  applicationsPerDay:         { type: String, default: '' },
  interviewCallsFrequency:    { type: String, default: '' },
  interviewsScheduledPerWeek: { type: String, required: true },
  availableForMeetingToday:   { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CandidateIntake', candidateIntakeSchema);
