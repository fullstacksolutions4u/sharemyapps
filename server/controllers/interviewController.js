const interviewService = require('../services/interview.service');
const InterviewDto = require('../dtos/interview.dto');

exports.listSessions = async (req, res) => {
  try {
    const options = InterviewDto.validateListOptions(req.query);
    const result = await interviewService.listSessions(options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await interviewService.getUserSessions(req.params.userId);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGeneralSession = async (req, res) => {
  try {
    const data = InterviewDto.validateCreateSession(req.body);
    const session = await interviewService.createGeneralSession(req.user._id, data);
    res.status(201).json({ session });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const data = InterviewDto.validateCreateSession(req.body);
    const session = await interviewService.createSession(req.user._id, req.params.userId, data);
    res.status(201).json({ session });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const data = InterviewDto.validateUpdateSession(req.body);
    const session = await interviewService.updateSession(req.params.sessionId, data);
    res.json({ session });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const result = await interviewService.deleteSession(req.params.sessionId);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.shareWithCandidate = async (req, res) => {
  try {
    const session = await interviewService.shareWithCandidate(req.params.sessionId);
    res.json({ session });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const sessions = await interviewService.getMyFeedback(req.user._id);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.summarizeMcqs = async (req, res) => {
  try {
    const data = InterviewDto.validateSummarizeMcqs(req.body);
    const result = await interviewService.summarizeMcqs(data);
    res.json(result);
  } catch (err) {
    console.error('[summarizeMcqs Error]:', err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Failed to generate AI summary: ' + err.message });
  }
};
