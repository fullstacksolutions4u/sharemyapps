const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const LearningFeedback = mongoose.models.LearningFeedback || mongoose.model('LearningFeedback', feedbackSchema);

const createFeedback = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
    const feedback = await LearningFeedback.create({
      user: req.user._id,
      username: req.user.name || 'Anonymous',
      message
    });
    res.status(201).json({ success: true, data: feedback, message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedback = await LearningFeedback.find().sort({ createdAt: -1 }).populate('user', 'name email');
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedback = await LearningFeedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.status(200).json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createFeedback, getAllFeedback, deleteFeedback };
