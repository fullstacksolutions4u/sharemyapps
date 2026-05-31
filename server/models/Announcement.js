const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  text:   { type: String, required: true, trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
