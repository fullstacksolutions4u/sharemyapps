const learningProgressService = require('../services/learningProgress.service');
const LearningProgressDto = require('../dtos/learningProgress.dto');

const getProgress = async (req, res) => {
  try {
    const result = await learningProgressService.getProgress(req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching progress' });
  }
};

const toggleTopicCompletion = async (req, res) => {
  try {
    const data = LearningProgressDto.validateToggleTopic(req.body);
    const result = await learningProgressService.toggleTopicCompletion(req.user, data);
    
    if (result._unauthenticated) {
      return res.status(200).json({
        success: true,
        message: result.message,
        progress: result.progress,
        _unauthenticated: true
      });
    }

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: error.message || 'Error updating progress' });
  }
};

const submitQuizAttempt = async (req, res) => {
  try {
    const data = LearningProgressDto.validateQuizAttempt(req.body);
    const result = await learningProgressService.submitQuizAttempt(req.user, data);
    res.status(200).json({
      success: true,
      message: 'Quiz attempt recorded',
      data: result
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, data: error.data });
    res.status(500).json({ success: false, message: error.message || 'Error submitting quiz attempt' });
  }
};

const getProgressStats = async (req, res) => {
  try {
    const stats = await learningProgressService.getProgressStats(req.user._id);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching statistics' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const result = await learningProgressService.getLeaderboard(req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProgress, toggleTopicCompletion, submitQuizAttempt, getProgressStats, getLeaderboard };
