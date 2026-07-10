const mongoose = require('mongoose');

// Reusable admin email templates (composed on the admin Email page, used in
// scenarios like free premium access grants). Body supports a {{name}} placeholder.
const emailTemplateSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true, unique: true },
  subject:   { type: String, required: true, trim: true },
  body:      { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
