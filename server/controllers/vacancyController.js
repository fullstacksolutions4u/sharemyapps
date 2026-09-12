const vacancyService = require('../services/vacancy.service');
const VacancyDto = require('../dtos/vacancy.dto');

exports.getVacancies = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString();
    const result = await vacancyService.getVacancies(userId);
    res.json(result);
  } catch (err) { next(err); }
};

exports.showInterest = async (req, res, next) => {
  try {
    const result = await vacancyService.showInterest(req.params.id, req.user, req.body.position);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.withdrawInterest = async (req, res, next) => {
  try {
    const result = await vacancyService.withdrawInterest(req.params.id, req.user._id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.reportVacancy = async (req, res, next) => {
  try {
    const data = VacancyDto.validateReportVacancy(req.body);
    const vacancy = await vacancyService.reportVacancy(req.user._id, data);
    res.status(201).json(vacancy);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

exports.getAllVacanciesAdmin = async (req, res, next) => {
  try {
    const vacancies = await vacancyService.getAllVacanciesAdmin();
    res.json(vacancies);
  } catch (err) { next(err); }
};

exports.createVacancy = async (req, res, next) => {
  try {
    const data = VacancyDto.validateCreateVacancy(req.body);
    const vacancy = await vacancyService.createVacancy(req.user._id, data);
    res.status(201).json(vacancy);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateVacancy = async (req, res, next) => {
  try {
    const data = VacancyDto.validateUpdateVacancy(req.body);
    const vacancy = await vacancyService.updateVacancy(req.params.id, data);
    res.json(vacancy);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

exports.replyToInterest = async (req, res, next) => {
  try {
    const data = VacancyDto.validateReplyToInterest(req.body);
    const result = await vacancyService.replyToInterest(req.params.id, req.user._id, data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.toggleVacancyStatus = async (req, res, next) => {
  try {
    const result = await vacancyService.toggleVacancyStatus(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteVacancy = async (req, res, next) => {
  try {
    const result = await vacancyService.deleteVacancy(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.updateApplicantStatus = async (req, res, next) => {
  try {
    const data = VacancyDto.validateUpdateApplicantStatus(req.body);
    const result = await vacancyService.updateApplicantStatus(req.params.id, req.user._id, data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.markVacancyViewed = async (req, res, next) => {
  try {
    const vacancy = await vacancyService.markVacancyViewed(req.params.id);
    res.json(vacancy);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getSharedProfiles = async (req, res, next) => {
  try {
    const result = await vacancyService.getSharedProfiles(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};
