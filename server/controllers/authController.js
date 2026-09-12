const authService = require('../services/auth.service');
const AuthDto = require('../dtos/auth.dto');

exports.register = async (req, res, next) => {
  try {
    const data = AuthDto.validateRegister(req.body);
    const result = await authService.register(data);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const data = AuthDto.validateLogin(req.body);
    const result = await authService.login(data);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user);
    res.json({ user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    // Note: Validation logic for the massive profile object is omitted for brevity in DTO, 
    // it's handled by sanitization in the service layer for now.
    const user = await authService.updateProfile(req.user._id, req.body, req.file);
    res.json({ user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await authService.deleteAvatar(req.user._id);
    res.json({ user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) { next(err); }
};

exports.selectRole = async (req, res, next) => {
  try {
    const data = AuthDto.validateRoleSelection(req.body);
    const user = await authService.selectRole(req.user._id, data);
    res.json({ user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const data = AuthDto.validateEmail(req.body);
    const result = await authService.forgotPassword(data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const data = AuthDto.validateVerifyOtp(req.body);
    const result = await authService.verifyOtp(data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const data = AuthDto.validateResetPassword(req.body);
    const result = await authService.resetPassword(data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const { url } = await authService.googleCallback(req.user);
    res.redirect(url);
  } catch (err) {
    console.error('[googleCallback] error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
  }
};
