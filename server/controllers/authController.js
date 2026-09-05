const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const { cloudinary, deleteImage } = require('../middleware/upload');
const { sendOtpEmail } = require('../utils/email');
// XSS Prevention — sanitize all user-supplied text before storing in MongoDB
// See docs/security/01_xss_prevention.md
const { sanitizeText, sanitizeRichText, sanitizeUrl, sanitizeTextArray } = require('../utils/sanitize');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const getNextRegNumber = async () => {
  const last = await User.findOne({ regNumber: { $exists: true } }).sort({ regNumber: -1 }).select('regNumber');
  return last?.regNumber ? last.regNumber + 1 : 101;
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
      existing.name = sanitizeText(name.trim());
      existing.password = password;
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.onboardingComplete = false;
      existing.userType = 'developer';
      await existing.save();
      const token = signToken(existing._id);
      setCookie(res, token);
      return res.status(201).json({ success: true, token, user: existing.toAuthJSON() });
    }

    const regNumber = await getNextRegNumber();
    const user = await User.create({ name, email, password, regNumber });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: user.toAuthJSON()
    });
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

    if (user.isBlocked)
      return res.status(403).json({ message: 'Your account has been suspended by an administrator.' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toAuthJSON()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
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

    // XSS Prevention: sanitize all text/URL fields before saving to MongoDB
    if (name?.trim()) user.name = sanitizeText(name.trim()).replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if (phone !== undefined) user.phone = sanitizeText(phone);
    if (linkedinUrl !== undefined) user.linkedinUrl = sanitizeUrl(linkedinUrl);
    if (githubUrl !== undefined) user.githubUrl = sanitizeUrl(githubUrl);
    if (leetcodeUrl !== undefined) user.leetcodeUrl = sanitizeUrl(leetcodeUrl);
    if (portfolioUrl !== undefined) user.portfolioUrl = sanitizeUrl(portfolioUrl);
    if (cvUrl !== undefined) {
      const trimmed = sanitizeUrl(cvUrl) || sanitizeText(cvUrl);
      const isPlaceholder = (u) => {
        const c = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return c === 'drive.google.com';
      };
      if (user.cvUrl && isPlaceholder(user.cvUrl)) user.cvWasPlaceholder = true;
      if (trimmed && isPlaceholder(trimmed)) user.cvWasPlaceholder = true;
      user.cvUrl = trimmed;
    }
    if (companyName !== undefined) user.companyName = sanitizeText(companyName);
    if (companyWebsite !== undefined) user.companyWebsite = sanitizeUrl(companyWebsite);
    if (industry !== undefined) user.industry = sanitizeText(industry);
    if (hrName !== undefined) user.hrName = sanitizeText(hrName);
    if (requirements !== undefined) user.requirements = sanitizeRichText(requirements);
    if (freelanceAvailable !== undefined) user.freelanceAvailable = Boolean(freelanceAvailable);
    if (freelanceRate !== undefined) user.freelanceRate = freelanceRate === '' || freelanceRate === null ? null : Number(freelanceRate);
    if (mentorshipAvailable !== undefined) user.mentorshipAvailable = Boolean(mentorshipAvailable);
    if (mentorshipRate !== undefined) user.mentorshipRate = mentorshipRate === '' || mentorshipRate === null ? null : Number(mentorshipRate);
    if (mentorshipTech !== undefined) user.mentorshipTech = sanitizeTextArray(Array.isArray(mentorshipTech) ? mentorshipTech : [mentorshipTech]);
    if (familiarTech !== undefined) user.familiarTech = sanitizeTextArray(Array.isArray(familiarTech) ? familiarTech : [familiarTech]);
    if (mentorshipSchedule !== undefined) user.mentorshipSchedule = (mentorshipSchedule && typeof mentorshipSchedule === 'object') ? mentorshipSchedule : null;
    if (languagePreference !== undefined) user.languagePreference = sanitizeTextArray(Array.isArray(languagePreference) ? languagePreference : [languagePreference]);
    if (joiningAvailability !== undefined) user.joiningAvailability = sanitizeText(joiningAvailability);
    if (currentSalary !== undefined) user.currentSalary = currentSalary === '' || currentSalary === null ? null : Number(currentSalary);
    if (expectedSalary !== undefined) user.expectedSalary = expectedSalary === '' || expectedSalary === null ? null : Number(expectedSalary);
    if (preferredLocations !== undefined) user.preferredLocations = sanitizeTextArray(Array.isArray(preferredLocations) ? preferredLocations : [preferredLocations]);
    if (jobMode !== undefined) user.jobMode = sanitizeTextArray(Array.isArray(jobMode) ? jobMode : [jobMode]);
    if (yearsOfExperience !== undefined) user.yearsOfExperience = sanitizeText(yearsOfExperience);
    if (gender !== undefined) user.gender = ['male', 'female', 'other', ''].includes(gender) ? gender : '';
    if (place !== undefined) user.place = sanitizeText(place);
    if (district !== undefined) user.district = sanitizeText(district);
    if (state !== undefined) user.state = sanitizeText(state);
    if (country !== undefined) user.country = sanitizeText(country);
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (designations !== undefined) {
      const hadDesignations = user.designations && user.designations.length > 0;
      user.designations = sanitizeTextArray(Array.isArray(designations) ? designations : [designations]);
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
        projectName: sanitizeText(clientProfile.projectName) || '',
        budget: clientProfile.budget ? Number(clientProfile.budget) : null,
        duration: sanitizeText(clientProfile.duration) || '',
        skillsNeeded: Array.isArray(clientProfile.skillsNeeded) ? sanitizeTextArray(clientProfile.skillsNeeded) : [],
        experienceLevel: sanitizeText(clientProfile.experienceLevel) || '',
        description: sanitizeRichText(clientProfile.description) || '',
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
      await User.findByIdAndDelete(userId);
    }
    res.json({ message: 'Account deleted successfully' });
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

exports.googleCallback = async (req, res) => {
  try {
    const token = signToken(req.user._id);

    // Always fetch fresh from DB — Passport may return a stale user object
    const user = await User.findById(req.user._id);

    if (user && user.isBlocked) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=blocked`);
    }

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
