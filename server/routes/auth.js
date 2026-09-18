const router = require('express').Router();
const crypto = require('crypto');
const passport = require('passport');
const {
  register, login, logout, getMe, updateProfile, deleteAccount, deleteAvatar, googleCallback, selectRole,
  forgotPassword, verifyOtp, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/select-role', protect, selectRole);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.delete('/avatar', protect, deleteAvatar);
router.delete('/account', protect, deleteAccount);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
  if (!googleEnabled) return res.status(503).json({ message: 'Google login is not configured' });
  // 'openid' is required by Google's v2/auth OpenID Connect endpoint.
  // 'state' is a random CSRF token stored in a short-lived cookie since session: false.
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 5 * 60 * 1000 });
  passport.authenticate('google', { scope: ['openid', 'profile', 'email'], session: false, state })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
  if (!googleEnabled) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
  // Validate CSRF state
  const storedState = req.cookies?.oauth_state;
  const returnedState = req.query?.state;
  if (!storedState || !returnedState || storedState !== returnedState) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_state_mismatch`);
  }
  res.clearCookie('oauth_state');
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` })(req, res, next);
}, googleCallback);

module.exports = router;
