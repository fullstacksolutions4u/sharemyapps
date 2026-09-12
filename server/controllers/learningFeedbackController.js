const feedbackService = require('../services/learningFeedback.service');
const LearningFeedbackDto = require('../dtos/learningFeedback.dto');

const createFeedback = async (req, res) => {
  try {
    const data = LearningFeedbackDto.validateCreate(req.body);
    const feedback = await feedbackService.createFeedback(req.user, data);
    res.status(201).json({ success: true, data: feedback, message: 'Feedback submitted successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedback = await feedbackService.getAllFeedback();
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const result = await feedbackService.deleteFeedback(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createFeedback, getAllFeedback, deleteFeedback };
