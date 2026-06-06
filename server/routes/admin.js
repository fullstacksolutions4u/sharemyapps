const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getPendingProjects,
  getAllProjects,
  updateProjectStatus,
  adminUpdateProject,
  getAllUsers,
  getStats,
  setBadge,
  setDesignation,
  adminUpdateUser,
  toggleFeatured,
  adminToggleHidden,
  toggleUserHidden,
  getResumes,
  deleteUser,
  setResumeData,
  setAdminNote,
} = require('../controllers/adminController');
const {
  getAllVacanciesAdmin,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  replyToInterest,
  toggleVacancyStatus,
} = require('../controllers/vacancyController');
const { adminGetUserJDHistory } = require('../controllers/jdAnalysisController');
const freelance = require('../controllers/freelanceOpportunityController');
const mentorship = require('../controllers/mentorshipOpportunityController');
const { aiChat } = require('../controllers/aiChatController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/projects', getAllProjects);
router.get('/projects/pending', getPendingProjects);
router.patch('/projects/:id/status', updateProjectStatus);
router.put('/projects/:id', adminUpdateProject);
router.get('/users', getAllUsers);
router.get('/resumes', getResumes);
router.patch('/users/:id/badge', setBadge);
router.patch('/users/:id/designation', setDesignation);
router.put('/users/:id', adminUpdateUser);
router.patch('/users/:id/hide', toggleUserHidden);
router.patch('/users/:id/note', setAdminNote);
router.put('/users/:id/resume', setResumeData);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/jd-history', adminGetUserJDHistory);
router.patch('/projects/:id/featured', toggleFeatured);
router.patch('/projects/:id/hide', adminToggleHidden);

router.get('/vacancies', getAllVacanciesAdmin);
router.post('/vacancies', createVacancy);
router.put('/vacancies/:id', updateVacancy);
router.delete('/vacancies/:id', deleteVacancy);
router.post('/vacancies/:id/reply', replyToInterest);
router.patch('/vacancies/:id/toggle-status', toggleVacancyStatus);

// Freelance opportunities
router.get('/freelance', freelance.getAllAdmin);
router.post('/freelance', freelance.create);
router.put('/freelance/:id', freelance.update);
router.delete('/freelance/:id', freelance.remove);
router.patch('/freelance/:id/toggle-status', freelance.toggleStatus);
router.post('/freelance/:id/reply', freelance.replyToInterest);

// Mentorship opportunities
router.get('/mentorship', mentorship.getAllAdmin);
router.post('/mentorship', mentorship.create);
router.put('/mentorship/:id', mentorship.update);
router.delete('/mentorship/:id', mentorship.remove);
router.patch('/mentorship/:id/toggle-status', mentorship.toggleStatus);
router.post('/mentorship/:id/reply', mentorship.replyToInterest);

router.post('/ai-chat', aiChat);

module.exports = router;
