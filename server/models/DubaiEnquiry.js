const mongoose = require('mongoose');

const dubaiEnquirySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'closed'],
    default: 'pending',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('DubaiEnquiry', dubaiEnquirySchema);
