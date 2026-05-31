const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:     { type: String, enum: ['approved', 'rejected', 'resubmit', 'like', 'rated', 'commented', 'vacancy_reply'], required: true },
  title:    { type: String, required: true },
  message:  { type: String, default: '' },
  project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  vacancy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy' },
  read:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
