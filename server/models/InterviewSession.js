const mongoose = require('mongoose');

const improvementTipSchema = new mongoose.Schema({
  area:        { type: String, required: true, trim: true }, // e.g. "DSA", "Communication"
  tip:         { type: String, required: true, trim: true },
  resourceUrl: { type: String, trim: true, default: '' },
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  title:  { type: String, required: true },  // Fixed: Communication | Technical Skills | Problem Solving | Attitude | Culture Fit
  rating: { type: Number, min: 1, max: 5, default: 3 },
  notes:  { type: String, trim: true, default: '' },
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionNumber: { type: Number, default: 1 },  // auto-incremented per user

  overallRating: { type: Number, min: 1, max: 10, default: 5 },
  headline:      { type: String, trim: true, default: '' },
  summary:       { type: String, trim: true, default: '' },
  googleMeetLink: { type: String, trim: true, default: '' },

  sections: {
    type: [sectionSchema],
    default: [
      { title: 'Communication',   rating: 3, notes: '' },
      { title: 'Technical Skills', rating: 3, notes: '' },
      { title: 'Problem Solving', rating: 3, notes: '' },
      { title: 'Attitude',        rating: 3, notes: '' },
      { title: 'Culture Fit',     rating: 3, notes: '' },
    ]
  },

  pros: [{ type: String, trim: true }],
  cons: [{ type: String, trim: true }],

  improvementTips: [improvementTipSchema],

  // Controls visibility of tips to the developer
  sharedWithCandidate:   { type: Boolean, default: false },
  sharedWithCandidateAt: { type: Date,    default: null },

  interviewedAt: { type: Date, default: Date.now },
}, { timestamps: true });

interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ evaluatedBy: 1, createdAt: -1 });
interviewSessionSchema.index({ interviewedAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
