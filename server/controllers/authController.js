const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const { cloudinary } = require('../middleware/upload');

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
    const { name, email, password, userType } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already in use' });

    const type = userType === 'client' ? 'client' : 'developer';
    const user = await User.create({ name, email, password, userType: type });
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

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, linkedinUrl, githubUrl, leetcodeUrl, companyName, companyWebsite, industry, requirements } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl.trim();
    if (githubUrl !== undefined) user.githubUrl = githubUrl.trim();
    if (leetcodeUrl !== undefined) user.leetcodeUrl = leetcodeUrl.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (companyWebsite !== undefined) user.companyWebsite = companyWebsite.trim();
    if (industry !== undefined) user.industry = industry.trim();
    if (requirements !== undefined) user.requirements = requirements.trim();

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ owner: userId });
    for (const project of projects) {
      const images = [project.bannerImage, ...project.screenshots].filter(Boolean);
      for (const url of images) {
        const pid = url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`sharemyapp/${pid}`).catch(() => {});
      }
      await Comment.deleteMany({ project: project._id });
      await project.deleteOne();
    }
    await User.findByIdAndDelete(userId);
    res.clearCookie('token');
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleCallback = (req, res) => {
  const token = signToken(req.user._id);
  setCookie(res, token);
  let dest = '/dashboard';
  if (req.user.role === 'admin') dest = '/admin';
  else if (req.user.userType === 'client') dest = '/client-profile';
  res.redirect(`${process.env.CLIENT_URL}${dest}`);
};
