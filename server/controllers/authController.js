const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const { cloudinary } = require('../middleware/upload');
const { sendOtpEmail } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const getNextRegNumber = async () => {
  const last = await User.findOne({ regNumber: { $exists: true } }).sort({ regNumber: -1 }).select('regNumber');
  return last?.regNumber ? last.regNumber + 1 : 101;
};

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

    const existing = await User.findOne({ email });
    if (existing) {
      if (!existing.isDeleted)
        return res.status(409).json({ message: 'Email already in use' });

      // Deleted account re-registering — reset it and send to role selection
      existing.name = name.trim();
      existing.password = password;
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.onboardingComplete = false;
      existing.userType = 'developer';
      await existing.save();
      const token = signToken(existing._id);
      setCookie(res, token);
      return res.status(201).json({ user: existing.toPublicJSON(), token });
    }

    const regNumber = await getNextRegNumber();
    const user = await User.create({ name, email, password, regNumber });
    const token = signToken(user._id);
    setCookie(res, token);
    res.status(201).json({ user: user.toPublicJSON(), token });
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

    if (user.isDeleted)
      return res.status(403).json({ message: 'This account has been deleted' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    setCookie(res, token);
    res.json({ user: user.toPublicJSON(), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    let dirty = false;
    // Auto-complete onboarding only for legacy users: field is undefined in DB (never set),
    // meaning they registered before the onboarding feature was added.
    // Re-registered or newly registered users have onboardingComplete explicitly set to false.
    if (user._doc.onboardingComplete === undefined && (user.userType === 'developer' || user.userType === 'client')) {
      user.onboardingComplete = true;
      dirty = true;
    }
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    if (user.badge === 'new_member' && Date.now() - new Date(user.createdAt).getTime() >= THREE_DAYS) {
      user.badge = 'active';
      dirty = true;
    }
    if (dirty) await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, linkedinUrl, githubUrl, leetcodeUrl, portfolioUrl, cvUrl, companyName, companyWebsite, industry, requirements,
      freelanceAvailable, freelanceRate, mentorshipAvailable, mentorshipRate, mentorshipTech, mentorshipSchedule, languagePreference,
      joiningAvailability, currentSalary, expectedSalary, preferredLocations, jobMode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl.trim();
    if (githubUrl !== undefined) user.githubUrl = githubUrl.trim();
    if (leetcodeUrl !== undefined) user.leetcodeUrl = leetcodeUrl.trim();
    if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl.trim();
    if (cvUrl !== undefined) user.cvUrl = cvUrl.trim();
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (companyWebsite !== undefined) user.companyWebsite = companyWebsite.trim();
    if (industry !== undefined) user.industry = industry.trim();
    if (requirements !== undefined) user.requirements = requirements.trim();
    if (freelanceAvailable !== undefined) user.freelanceAvailable = Boolean(freelanceAvailable);
    if (freelanceRate !== undefined) user.freelanceRate = freelanceRate === '' || freelanceRate === null ? null : Number(freelanceRate);
    if (mentorshipAvailable !== undefined) user.mentorshipAvailable = Boolean(mentorshipAvailable);
    if (mentorshipRate !== undefined) user.mentorshipRate = mentorshipRate === '' || mentorshipRate === null ? null : Number(mentorshipRate);
    if (mentorshipTech !== undefined) user.mentorshipTech = (Array.isArray(mentorshipTech) ? mentorshipTech : [mentorshipTech]).map(t => t.trim()).filter(Boolean);
    if (mentorshipSchedule !== undefined) user.mentorshipSchedule = (mentorshipSchedule && typeof mentorshipSchedule === 'object') ? mentorshipSchedule : null;
    if (languagePreference !== undefined) user.languagePreference = (Array.isArray(languagePreference) ? languagePreference : [languagePreference]).map(l => l.trim()).filter(Boolean);
    if (joiningAvailability !== undefined) user.joiningAvailability = joiningAvailability.trim();
    if (currentSalary !== undefined) user.currentSalary = currentSalary === '' || currentSalary === null ? null : Number(currentSalary);
    if (expectedSalary !== undefined) user.expectedSalary = expectedSalary === '' || expectedSalary === null ? null : Number(expectedSalary);
    if (preferredLocations !== undefined) user.preferredLocations = (Array.isArray(preferredLocations) ? preferredLocations : [preferredLocations]).map(l => l.trim()).filter(Boolean);
    if (jobMode !== undefined) user.jobMode = (Array.isArray(jobMode) ? jobMode : [jobMode]).map(m => m.trim()).filter(Boolean);

    const { clientProfile } = req.body;
    if (clientProfile !== undefined && clientProfile && typeof clientProfile === 'object') {
      user.clientProfile = {
        projectName: clientProfile.projectName?.trim() || '',
        budget: clientProfile.budget ? Number(clientProfile.budget) : null,
        duration: clientProfile.duration?.trim() || '',
        skillsNeeded: Array.isArray(clientProfile.skillsNeeded) ? clientProfile.skillsNeeded : [],
        experienceLevel: clientProfile.experienceLevel?.trim() || '',
        description: clientProfile.description?.trim() || '',
      };
    }

    if (req.file) {
      if (user.avatar && user.avatar.includes('cloudinary')) {
        const pid = user.avatar.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`sharemyapp/${pid}`).catch(() => {});
      }
      user.avatar = req.file.path;
    }

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
    const user = await User.findById(userId);
    if (user) {
      user.isDeleted = true;
      user.deletedAt = new Date();
      await user.save();
    }
    res.clearCookie('token');
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.selectRole = async (req, res) => {
  try {
    const { userType, menteeProfile, clientProfile } = req.body;
    if (!['developer', 'recruiter', 'client', 'mentee', 'mentor'].includes(userType))
      return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.userType = userType;
    user.onboardingComplete = true;

    if (userType === 'mentee' && menteeProfile) {
      user.menteeProfile = {
        education: menteeProfile.education?.trim() || '',
        location: menteeProfile.location?.trim() || '',
        dateOfBirth: menteeProfile.dateOfBirth || null,
        currentSkills: Array.isArray(menteeProfile.currentSkills) ? menteeProfile.currentSkills : [],
        lookingToLearn: Array.isArray(menteeProfile.lookingToLearn) ? menteeProfile.lookingToLearn : [],
      };
    }

    if (userType === 'client' && clientProfile) {
      const cp = {
        projectName: clientProfile.projectName?.trim() || '',
        budget: clientProfile.budget ? Number(clientProfile.budget) : null,
        duration: clientProfile.duration?.trim() || '',
        skillsNeeded: Array.isArray(clientProfile.skillsNeeded) ? clientProfile.skillsNeeded : [],
        experienceLevel: clientProfile.experienceLevel?.trim() || '',
        description: clientProfile.description?.trim() || '',
      };
      user.clientProfile = cp;
      // Seed sign-up project as the first entry in clientProjects
      if (cp.projectName) {
        user.clientProjects = [{
          _id: new (require('mongoose').Types.ObjectId)().toString(),
          ...cp,
          status: 'open',
          createdAt: new Date(),
        }];
      }
    }

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond success to avoid user enumeration
    if (!user || user.isDeleted) {
      return res.json({ message: 'If that email exists, an OTP has been sent' });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();
    await sendOtpEmail({ to: email, otp });
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP. Try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpiry)
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (user.resetOtpExpiry < new Date())
      return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    if (user.resetOtp !== otp.trim())
      return res.status(400).json({ message: 'Incorrect OTP' });
    res.json({ message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.resetOtp || !user.resetOtpExpiry)
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (user.resetOtpExpiry < new Date())
      return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    if (user.resetOtp !== otp.trim())
      return res.status(400).json({ message: 'Incorrect OTP' });
    user.password = password;
    user.markModified('password');
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.googleCallback = (req, res) => {
  const token = signToken(req.user._id);
  setCookie(res, token);
  let dest = '/select-role';
  if (req.user.role === 'admin') dest = '/admin';
  else if (req.user.onboardingComplete) {
    if (req.user.userType === 'recruiter') dest = req.user.companyName ? '/find-developers' : '/client-profile';
    else if (req.user.userType === 'client') dest = '/client-profile';
    else if (req.user.userType === 'mentee') dest = '/developers';
    else dest = '/dashboard';
  }
  res.redirect(`${process.env.CLIENT_URL}${dest}?token=${token}`);
};
