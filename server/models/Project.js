const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  liveUrl: { type: String, required: true, trim: true },
  bannerImage: { type: String, default: '' },
  screenshots: [{ type: String }],
  techTags: [{ type: String, trim: true }],
  contactEmail: { type: String, trim: true, default: '' },
  contactPhone: { type: String, trim: true, default: '' },
  linkedinUrl: { type: String, trim: true, default: '' },
  githubUrl: { type: String, trim: true, default: '' },
  githubUrls: [{ type: String, trim: true }],
  githubVisible: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

projectSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Project', projectSchema);
