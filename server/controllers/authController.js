const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const { cloudinary, deleteImage } = require('../middleware/upload');
const { sendOtpEmail } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const getNextRegNumber = async () => {
  const last = await User.findOne({ regNumber: { $exists: true } }).sort({ regNumber: -1 }).select('regNumber');
  return last?.regNumber ? last.regNumber + 1 : 101;
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

const setCookie = (res, token) => {
  res.cookie('token', token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// clearCookie must use the same attributes the cookie was set with —
// cross-site responses silently drop Set-Cookie without SameSite=None; Secure
const clearAuthCookie = (res) => res.clearCookie('token', cookieOptions());

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
      return res.status(201).json({ user: existing.toAuthJSON(), token });
    }

    const regNumber = await getNextRegNumber();
    const user = await User.create({ name, email, password, regNumber });
    const token = signToken(user._id);
    setCookie(res, token);
    
    // Track new signup
    const { userActivityCounter } = require('../utils/customMetrics');
    userActivityCounter.inc({ action: 'signup' });

    res.status(201).json({ user: user.toAuthJSON(), token });
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
    
    // Track login
    const { userActivityCounter } = require('../utils/customMetrics');
    userActivityCounter.inc({ action: 'login' });

    res.json({ user: user.toAuthJSON(), token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (_req, res) => {
  clearAuthCookie(res);
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
    res.json({ user: user.toAuthJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, linkedinUrl, githubUrl, leetcodeUrl, portfolioUrl, cvUrl, companyName, companyWebsite, industry, hrName, requirements,
      freelanceAvailable, freelanceRate, mentorshipAvailable, mentorshipRate, mentorshipTech, familiarTech, mentorshipSchedule, languagePreference,
      joiningAvailability, currentSalary, expectedSalary, preferredLocations, jobMode, yearsOfExperience,
      gender, place, district, state, country, dateOfBirth, designations } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name?.trim()) user.name = name.trim().replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if (phone !== undefined) user.phone = phone.trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl.trim();
    if (githubUrl !== undefined) user.githubUrl = githubUrl.trim();
    if (leetcodeUrl !== undefined) user.leetcodeUrl = leetcodeUrl.trim();
    if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl.trim();
    if (cvUrl !== undefined) {
      const trimmed = cvUrl.trim();
      const isPlaceholder = (u) => {
        const c = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return c === 'drive.google.com';
      };
      if (user.cvUrl && isPlaceholder(user.cvUrl)) user.cvWasPlaceholder = true;
      if (trimmed && isPlaceholder(trimmed)) user.cvWasPlaceholder = true;
      user.cvUrl = trimmed;
    }
    if (companyName !== undefined) user.companyName = companyName.trim();
    if (companyWebsite !== undefined) user.companyWebsite = companyWebsite.trim();
    if (industry !== undefined) user.industry = industry.trim();
    if (hrName !== undefined) user.hrName = hrName.trim();
    if (requirements !== undefined) user.requirements = requirements.trim();
    if (freelanceAvailable !== undefined) user.freelanceAvailable = Boolean(freelanceAvailable);
    if (freelanceRate !== undefined) user.freelanceRate = freelanceRate === '' || freelanceRate === null ? null : Number(freelanceRate);
    if (mentorshipAvailable !== undefined) user.mentorshipAvailable = Boolean(mentorshipAvailable);
    if (mentorshipRate !== undefined) user.mentorshipRate = mentorshipRate === '' || mentorshipRate === null ? null : Number(mentorshipRate);
    if (mentorshipTech !== undefined) user.mentorshipTech = (Array.isArray(mentorshipTech) ? mentorshipTech : [mentorshipTech]).map(t => t.trim()).filter(Boolean);
    if (familiarTech !== undefined) user.familiarTech = (Array.isArray(familiarTech) ? familiarTech : [familiarTech]).map(t => t.trim()).filter(Boolean);
    if (mentorshipSchedule !== undefined) user.mentorshipSchedule = (mentorshipSchedule && typeof mentorshipSchedule === 'object') ? mentorshipSchedule : null;
    if (languagePreference !== undefined) user.languagePreference = (Array.isArray(languagePreference) ? languagePreference : [languagePreference]).map(l => l.trim()).filter(Boolean);
    if (joiningAvailability !== undefined) user.joiningAvailability = joiningAvailability.trim();
    if (currentSalary !== undefined) user.currentSalary = currentSalary === '' || currentSalary === null ? null : Number(currentSalary);
    if (expectedSalary !== undefined) user.expectedSalary = expectedSalary === '' || expectedSalary === null ? null : Number(expectedSalary);
    if (preferredLocations !== undefined) user.preferredLocations = (Array.isArray(preferredLocations) ? preferredLocations : [preferredLocations]).map(l => l.trim()).filter(Boolean);
    if (jobMode !== undefined) user.jobMode = (Array.isArray(jobMode) ? jobMode : [jobMode]).map(m => m.trim()).filter(Boolean);
    if (yearsOfExperience !== undefined) user.yearsOfExperience = yearsOfExperience.trim();
    if (gender !== undefined) user.gender = ['male', 'female', 'other', ''].includes(gender) ? gender : '';
    if (place !== undefined) user.place = place.trim();
    if (district !== undefined) user.district = district.trim();
    if (state !== undefined) user.state = state.trim();
    if (country !== undefined) user.country = country.trim();
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (designations !== undefined) {
      const hadDesignations = user.designations && user.designations.length > 0;
      user.designations = (Array.isArray(designations) ? designations : [designations]).map(d => String(d).trim()).filter(Boolean);
      const hasDesignationsNow = user.designations.length > 0;

      if (!hadDesignations && hasDesignationsNow) {
        const existingActivity = await Activity.findOne({ user: user._id, type: 'USER_JOINED' });
        if (!existingActivity) {
          await Activity.create({ user: user._id, type: 'USER_JOINED' });
        }
      }
    }

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
      if (user.avatar) {
        await deleteImage(user.avatar);
      }
      user.avatar = req.file.path;
    }

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.avatar) {
      await deleteImage(user.avatar);
    }
    user.avatar = '';
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
        await deleteImage(url);
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
    clearAuthCookie(res);
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
    
    // Only track the duration the very first time they complete onboarding
    if (!user.onboardingComplete) {
      const { onboardingDuration } = require('../utils/customMetrics');
      const timeTakenSeconds = (Date.now() - new Date(user.createdAt).getTime()) / 1000;
      onboardingDuration.observe({ userType: userType }, timeTakenSeconds);
    }
    
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

exports.googleCallback = async (req, res) => {
  try {
    const token = signToken(req.user._id);
    setCookie(res, token);

    // Always fetch fresh from DB — Passport may return a stale user object
    const user = await User.findById(req.user._id);

    let dest = '/select-role';
    let fromOnboarding = false;

    if (user.role === 'admin') dest = '/admin';
    else if (user.onboardingComplete) {
      if (user.userType === 'recruiter') dest = user.companyName ? '/find-developers' : '/client-profile';
      else if (user.userType === 'client') dest = '/client-profile';
      else if (user.userType === 'mentee') dest = '/developers';
      else if (user.userType === 'developer') {
        const profileComplete = !!(user.cvUrl && user.cvUrl.trim());
        if (!profileComplete) { dest = '/profile'; fromOnboarding = true; }
        else dest = '/dashboard';
      }
    }

    const query = fromOnboarding ? `?token=${token}&fromOnboarding=true` : `?token=${token}`;
    res.redirect(`${process.env.CLIENT_URL}${dest}${query}`);
  } catch (err) {
    console.error('[googleCallback] error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth`);
  }
};
