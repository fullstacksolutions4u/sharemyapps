const jobLinkService = require('../services/jobLink.service');
const JobLinkDto = require('../dtos/jobLink.dto');

exports.getJobLinkApplyEligibility = async (req, res) => {
  try {
    const eligibility = await jobLinkService.getJobLinkApplyEligibility(req.user._id);
    res.json({ success: true, data: eligibility });
  } catch (error) {
    console.error('Error fetching job link apply eligibility:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getJobLinks = async (req, res) => {
  try {
    const jobLinks = await jobLinkService.getJobLinks();
    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createJobLink = async (req, res) => {
  try {
    const data = JobLinkDto.validateCreate(req.body);
    const populatedLink = await jobLinkService.createJobLink(req.user._id, data);
    res.json({ success: true, data: populatedLink });
  } catch (error) {
    console.error('Error creating job link:', error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminJobLinks = async (req, res) => {
  try {
    const jobLinks = await jobLinkService.getAdminJobLinks();
    res.json({ success: true, data: jobLinks });
  } catch (error) {
    console.error('Error fetching admin job links:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createAdminJobLink = async (req, res) => {
  try {
    const data = JobLinkDto.validateAdminCreate(req.body);
    const populatedLink = await jobLinkService.createAdminJobLink(req.user._id, data);
    res.json({ success: true, data: populatedLink });
  } catch (error) {
    console.error('Error creating admin job link:', error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateJobLink = async (req, res) => {
  try {
    const data = JobLinkDto.validateAdminUpdate(req.body);
    const link = await jobLinkService.updateJobLink(req.params.id, data);
    res.json({ success: true, data: link });
  } catch (error) {
    console.error('Error updating job link:', error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.extractJobDetails = async (req, res) => {
  try {
    const data = JobLinkDto.validateExtract(req.body);
    const processedJobs = await jobLinkService.extractJobDetails(data);
    res.json({ success: true, data: processedJobs });
  } catch (error) {
    console.error('Error extracting job details:', error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to extract job details. Try again.' });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const data = JobLinkDto.validateFeedback(req.body);
    const feedback = await jobLinkService.submitFeedback(req.user._id, req.params.id, data.heardBack);
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error submitting job link feedback:', error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminFeedback = async (req, res) => {
  try {
    const feedback = await jobLinkService.getAdminFeedback();
    res.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAdminCompanies = async (req, res) => {
  try {
    const companies = await jobLinkService.getAdminCompanies();
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching admin companies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const result = await jobLinkService.recordClick(req.user._id, req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error recording job link click:', error);
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
