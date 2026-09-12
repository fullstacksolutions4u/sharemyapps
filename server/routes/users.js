const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const aiLimit = require('../middleware/aiLimit');
const { jdQuota } = require('../middleware/jdQuota');

// Controllers
const userStatsController = require('../controllers/userStatsController');
const userBrowseController = require('../controllers/userBrowseController');
const userProfileController = require('../controllers/userProfileController');
const userSearchController = require('../controllers/userSearchController');

// ── STATS ─────────────────────────────────────────────────────────────
router.get('/count', userStatsController.getCount);
router.get('/stats', userStatsController.getHeroStats);
router.get('/overview-stats', protect, userStatsController.getOverviewStats);

// ── BROWSE & SEARCH ───────────────────────────────────────────────────
router.get('/search', userBrowseController.searchUsers);
router.get('/recent', userBrowseController.getRecentDevelopers);
router.get('/showcase-devs', optionalAuth, userBrowseController.getShowcaseDevs);
router.get('/developers', optionalAuth, userBrowseController.getDevelopers);
router.get('/candidates', protect, userBrowseController.getCandidates);
router.get('/mentors', optionalAuth, userBrowseController.getMentors);

// ── AI MATCHING ───────────────────────────────────────────────────────
router.post('/find-developers', protect, jdQuota, aiLimit, userSearchController.findDevelopers);

// ── PROFILE INTERACTIONS ──────────────────────────────────────────────
router.get('/applications', protect, userProfileController.getApplications);
router.post('/:id/portfolio-visit', protect, userProfileController.recordPortfolioVisit);
router.post('/:id/follow', protect, userProfileController.toggleFollow);

// ── CLIENT PROJECTS ───────────────────────────────────────────────────
router.get('/client-projects', protect, userProfileController.getClientProjects);
router.post('/client-projects', protect, userProfileController.addClientProject);
router.put('/client-projects/:projectId', protect, userProfileController.updateClientProject);
router.delete('/client-projects/:projectId', protect, userProfileController.deleteClientProject);

module.exports = router;
