const adminService = require('../services/admin.service');
const AdminDto = require('../dtos/admin.dto');

exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await adminService.getPendingProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const result = await adminService.getAllProjects(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const data = AdminDto.validateUpdateProjectStatus(req.body);
    const project = await adminService.updateProjectStatus(req.params.id, data);
    res.json(project);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.adminUpdateProject = async (req, res) => {
  try {
    const data = AdminDto.validateAdminUpdateProject(req.body);
    const project = await adminService.adminUpdateProject(req.params.id, data);
    res.json(project);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await adminService.getAllUsers(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const users = await adminService.getResumes();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleFeatured = async (req, res) => {
  try {
    const result = await adminService.toggleFeatured(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.adminToggleHidden = async (req, res) => {
  try {
    const result = await adminService.adminToggleHidden(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.toggleUserHidden = async (req, res) => {
  try {
    const result = await adminService.toggleUserHidden(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.setAdminNote = async (req, res) => {
  try {
    const result = await adminService.setAdminNote(req.params.id, req.body.note);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    const data = AdminDto.validateAdminUpdateUser(req.body);
    const user = await adminService.adminUpdateUser(req.params.id, data);
    res.json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.setDesignation = async (req, res) => {
  try {
    const designations = AdminDto.validateSetDesignation(req.body);
    const result = await adminService.setDesignation(req.params.id, designations);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.setBadge = async (req, res) => {
  try {
    const badge = AdminDto.validateSetBadge(req.body);
    const user = await adminService.setBadge(req.params.id, badge);
    res.json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.setResumeData = async (req, res) => {
  try {
    const resumeData = AdminDto.validateSetResumeData(req.body);
    const result = await adminService.setResumeData(req.params.id, resumeData);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const result = await adminService.deleteProject(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const result = await adminService.getStats();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserGrowth = async (req, res) => {
  try {
    const result = await adminService.getUserGrowth(req.query.mode, req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEmailRecipients = async (req, res) => {
  try {
    const result = await adminService.getEmailRecipients();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendCustomEmail = async (req, res) => {
  try {
    const data = AdminDto.validateSendCustomEmail(req.body);
    const result = await adminService.sendCustomEmail(data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getEmailTemplates = async (_req, res) => {
  try {
    const templates = await adminService.getEmailTemplates();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const data = AdminDto.validateCreateEmailTemplate(req.body);
    const template = await adminService.createEmailTemplate(req.user._id, data);
    res.status(201).json({ template });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A template with this name already exists' });
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.updateEmailTemplate = async (req, res) => {
  try {
    const data = AdminDto.validateCreateEmailTemplate(req.body);
    const template = await adminService.updateEmailTemplate(req.params.id, data);
    res.json({ template });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A template with this name already exists' });
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEmailTemplate = async (req, res) => {
  try {
    const result = await adminService.deleteEmailTemplate(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const result = await adminService.getCompanies();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
