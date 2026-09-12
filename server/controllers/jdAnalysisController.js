const jdAnalysisService = require('../services/jdAnalysis.service');
const JDAnalysisDto = require('../dtos/jdAnalysis.dto');

const saveSearchHistory = async (req, res) => {
  try {
    const data = JDAnalysisDto.validateSaveHistory(req.body);
    await jdAnalysisService.saveSearchHistory(req.user._id, data);
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

const getSearchHistory = async (req, res) => {
  try {
    const history = await jdAnalysisService.getSearchHistory(req.user._id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSearchHistory = async (req, res) => {
  try {
    const result = await jdAnalysisService.deleteSearchHistory(req.params.id, req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminGetUserJDHistory = async (req, res) => {
  try {
    const history = await jdAnalysisService.adminGetUserJDHistory(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const clearAllSearchHistory = async (req, res) => {
  try {
    const result = await jdAnalysisService.clearAllSearchHistory(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getQuota = async (req, res) => {
  try {
    const quotaInfo = await jdAnalysisService.getQuota(req.user._id);
    res.json(quotaInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { saveSearchHistory, getSearchHistory, deleteSearchHistory, clearAllSearchHistory, adminGetUserJDHistory, getQuota };
