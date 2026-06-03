const mongoose = require('mongoose');

const jdSearchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jd: { type: String, required: true },
  jdSnippet: { type: String, required: true },
  extracted: { type: mongoose.Schema.Types.Mixed, default: {} },
  resultCount: { type: Number, default: 0 },
  developers: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

jdSearchHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('JDSearchHistory', jdSearchHistorySchema);
