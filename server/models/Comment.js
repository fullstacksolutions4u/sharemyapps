const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

commentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
