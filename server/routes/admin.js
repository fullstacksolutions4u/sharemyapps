const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getPendingProjects,
  getAllProjects,
  updateProjectStatus,
  adminUpdateProject,
  getAllUsers,
  getStats,
  getUserGrowth,
  setBadge,
  setDesignation,
  adminUpdateUser,
  toggleFeatured,
  adminToggleHidden,
  toggleUserHidden,
  getResumes,
  deleteUser,
  deleteProject,
  setResumeData,
  setAdminNote,
} = require('../controllers/adminController');
const { adminSendMessage } = require('../controllers/messageController');
const {
  getAllVacanciesAdmin,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  replyToInterest,
  toggleVacancyStatus,
} = require('../controllers/vacancyController');
const { adminGetUserJDHistory } = require('../controllers/jdAnalysisController');
const { adminGetPayments } = require('../controllers/paymentController');
const { getAdminConfig, updateAdminConfig } = require('../controllers/configController');
const freelance = require('../controllers/freelanceOpportunityController');
const mentorship = require('../controllers/mentorshipOpportunityController');
const { aiChat } = require('../controllers/aiChatController');
const { adminGetPlans, adminCreatePlan, adminUpdatePlan, adminDeletePlan } = require('../controllers/planController');
const { adminGetOffers, adminUpdateOffer, adminDeleteOffer, adminGetOfferStats, adminGetOfferPortfolio, adminMarkWhatsappContacted, adminToggleEnroll } = require('../controllers/freeOfferController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/user-growth', getUserGrowth);
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
router.post('/users/:id/message', adminSendMessage);
router.get('/users/:id/jd-history', adminGetUserJDHistory);
router.get('/users/:id/portfolio-visits', async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const visits = await Notification.find({ fromUser: req.params.id, type: 'recruiter_visit' })
      .populate('user', 'name avatar email designations regNumber')
      .sort({ createdAt: -1 })
      .lean();
    res.json(visits);
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/projects/:id', deleteProject);
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

router.get('/payments', adminGetPayments);
router.get('/config', getAdminConfig);
router.put('/config', updateAdminConfig);

router.get('/plans', adminGetPlans);
router.post('/plans', adminCreatePlan);
router.put('/plans/:id', adminUpdatePlan);
router.delete('/plans/:id', adminDeletePlan);

// Free offer applications
router.get('/offers', adminGetOffers);
router.get('/offers/stats', adminGetOfferStats);
router.get('/offers/:id/portfolio', adminGetOfferPortfolio);
router.patch('/offers/:id/whatsapp-contacted', adminMarkWhatsappContacted);
router.patch('/offers/:id/enroll', adminToggleEnroll);
router.patch('/offers/:id', adminUpdateOffer);
router.delete('/offers/:id', adminDeleteOffer);

router.post('/ai-chat', aiChat);

module.exports = router;
