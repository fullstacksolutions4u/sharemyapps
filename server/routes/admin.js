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
} = require('../controllers/adminController');
const {
  getAllVacanciesAdmin,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  replyToInterest,
  toggleVacancyStatus,
} = require('../controllers/vacancyController');

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
router.put('/users/:id/resume', setResumeData);
router.delete('/users/:id', deleteUser);
router.patch('/projects/:id/featured', toggleFeatured);
router.patch('/projects/:id/hide', adminToggleHidden);

router.get('/vacancies', getAllVacanciesAdmin);
router.post('/vacancies', createVacancy);
router.put('/vacancies/:id', updateVacancy);
router.delete('/vacancies/:id', deleteVacancy);
router.post('/vacancies/:id/reply', replyToInterest);
router.patch('/vacancies/:id/toggle-status', toggleVacancyStatus);

module.exports = router;
