const router = require('express').Router();
const passport = require('passport');
const {
  register, login, logout, getMe, googleCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
  if (!googleEnabled) return res.status(503).json({ message: 'Google login is not configured' });
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` })(req, res, next);
}, googleCallback);

module.exports = router;
