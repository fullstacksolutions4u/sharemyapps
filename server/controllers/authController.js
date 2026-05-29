const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    setCookie(res, token);
    res.status(201).json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    setCookie(res, token);
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

exports.getMe = (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
};

exports.googleCallback = (req, res) => {
  const token = signToken(req.user._id);
  setCookie(res, token);
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};
