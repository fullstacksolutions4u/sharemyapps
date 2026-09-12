const projectService = require('../services/project.service');
const ProjectDto = require('../dtos/project.dto');

exports.getFeaturedProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getFeaturedProjects(req.user);
    res.json(projects);
  } catch (err) { next(err); }
};

exports.getProjects = async (req, res, next) => {
  try {
    const result = await projectService.getProjects(req.user, req.query);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user);
    res.json(project);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.getUserProjects = async (req, res, next) => {
  try {
    const result = await projectService.getUserProjects(req.params.userId, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getMyProjects(req.user);
    res.json(projects);
  } catch (err) { next(err); }
};

exports.createProject = async (req, res, next) => {
  try {
    const data = ProjectDto.validateCreate(req.body);
    const project = await projectService.createProject(data, req.files || {}, req.user);
    res.status(201).json(project);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.files || {}, req.user);
    res.json(project);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.recordView = async (req, res, next) => {
  try {
    const result = await projectService.recordView(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const result = await projectService.toggleLike(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.rateProject = async (req, res, next) => {
  try {
    const data = ProjectDto.validateRating(req.body);
    const result = await projectService.rateProject(req.params.id, data.value, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await projectService.getComments(req.params.id);
    res.json(comments);
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const data = ProjectDto.validateComment(req.body);
    const comment = await projectService.addComment(req.params.id, data.text, req.user);
    res.status(201).json(comment);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const result = await projectService.deleteComment(req.params.commentId, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.toggleHidden = async (req, res, next) => {
  try {
    const result = await projectService.toggleHidden(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

// Extracted from route: /count
exports.countProjects = async (req, res, next) => {
  try {
    const count = await projectService.countProjects();
    res.json({ count });
  } catch (err) { next(err); }
};

// Extracted from route: /showcase
exports.getShowcaseProjects = async (req, res, next) => {
  try {
    const skip = Math.max(parseInt(req.query.skip) || 99, 0);
    const limit = Math.min(parseInt(req.query.limit) || 4, 10);
    const projects = await projectService.getShowcaseProjects(skip, limit);
    res.json(projects);
  } catch (err) { next(err); }
};
