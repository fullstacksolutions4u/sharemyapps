const mongoose = require('mongoose');

const emailQuotaSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: 'YYYY-MM-DD'
  count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('EmailQuota', emailQuotaSchema);
