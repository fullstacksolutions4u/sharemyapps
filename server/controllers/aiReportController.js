const aiReportService = require('../services/aiReport.service');
const AiReportDto = require('../dtos/aiReport.dto');

exports.analyzeReport = async (req, res) => {
  try {
    const data = AiReportDto.validateAnalyze(req.body);
    const aiReport = await aiReportService.analyzeReport(data);
    res.status(200).json({ success: true, data: aiReport });
  } catch (error) {
    console.error('Error analyzing report:', error);
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message || 'Error communicating with AI' });
  }
};
