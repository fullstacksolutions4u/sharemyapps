const mongoose = require('mongoose');
const crypto = require('crypto');

const genSlug = () => 'sma-' + crypto.randomBytes(5).toString('hex');

const showcasePageSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    default: genSlug,
  },

  title:         { type: String, required: true, trim: true },
  recruiterName: { type: String, trim: true, default: '' },
  companyName:   { type: String, trim: true, default: '' },
  jdNote:        { type: String, trim: true, default: '' },

  // Ordered list of User IDs for the shortlisted candidates
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  isActive:  { type: Boolean, default: true },
  expiresAt: { type: Date,    default: null },

  viewCount: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

showcasePageSchema.index({ slug: 1 });
showcasePageSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('ShowcasePage', showcasePageSchema);
