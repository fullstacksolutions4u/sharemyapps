const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepo = require('../repositories/user.repository');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const { deleteImage } = require('../middleware/upload');
const { sendOtpEmail } = require('../utils/email');
const { sanitizeText, sanitizeRichText, sanitizeUrl, sanitizeTextArray } = require('../utils/sanitize');
const mongoose = require('mongoose');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

class AuthService {
  async register(data) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) {
      if (!existing.isDeleted) {
        const err = new Error('Email already in use'); err.status = 409; throw err;
      }
      existing.name = sanitizeText(data.name.trim());
      existing.password = data.password;
      existing.isDeleted = false;
      existing.deletedAt = null;
      existing.onboardingComplete = false;
      existing.userType = 'developer';
      await existing.save();
      const token = signToken(existing._id);
      return { token, user: existing.toAuthJSON() };
    }

    const regNumber = await userRepo.findLastRegNumber();
    const user = await userRepo.create({ name: data.name, email: data.email, password: data.password, regNumber });
    const token = signToken(user._id);
    return { token, user: user.toAuthJSON() };
  }

  async login(data) {
    const user = await userRepo.findByEmail(data.email);
    if (!user || !user.password) {
      const err = new Error('Invalid credentials'); err.status = 401; throw err;
    }
    if (user.isDeleted) {
      const err = new Error('This account has been deleted'); err.status = 403; throw err;
    }
    if (user.isBlocked) {
      const err = new Error('Your account has been suspended by an administrator.'); err.status = 403; throw err;
    }
    const match = await user.comparePassword(data.password);
    if (!match) {
      const err = new Error('Invalid credentials'); err.status = 401; throw err;
    }
    const token = signToken(user._id);
    return { token, user: user.toAuthJSON() };
  }

  async getMe(user) {
    let dirty = false;
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
    return user.toAuthJSON();
  }

  async updateProfile(userId, data, file) {
    const user = await userRepo.findById(userId);
    if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }

    const { name, phone, linkedinUrl, githubUrl, leetcodeUrl, portfolioUrl, cvUrl, companyName, companyWebsite, industry, hrName, requirements,
      freelanceAvailable, freelanceRate, mentorshipAvailable, mentorshipRate, mentorshipTech, familiarTech, mentorshipSchedule, languagePreference,
      joiningAvailability, currentSalary, expectedSalary, preferredLocations, jobMode, yearsOfExperience,
      gender, place, district, state, country, dateOfBirth, designations, clientProfile } = data;

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

    if (file) {
      if (user.avatar) {
        await deleteImage(user.avatar);
      }
      user.avatar = file.path;
    }

    await user.save();
    return user.toPublicJSON();
  }

  async deleteAvatar(userId) {
    const user = await userRepo.findById(userId);
    if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }
    if (user.avatar) {
      await deleteImage(user.avatar);
    }
    user.avatar = '';
    await user.save();
    return user.toPublicJSON();
  }

  async deleteAccount(userId) {
    const projects = await Project.find({ owner: userId });
    for (const project of projects) {
      const images = [project.bannerImage, ...project.screenshots].filter(Boolean);
      for (const url of images) {
        await deleteImage(url);
      }
      await Comment.deleteMany({ project: project._id });
      await project.deleteOne();
    }
    const user = await userRepo.findById(userId);
    if (user) {
      user.isDeleted = true;
      user.deletedAt = new Date();
      await userRepo.deleteById(userId);
    }
  }

  async selectRole(userId, data) {
    const { userType, menteeProfile, clientProfile } = data;
    const user = await userRepo.findById(userId);
    if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }
    
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
      if (cp.projectName) {
        user.clientProjects = [{
          _id: new mongoose.Types.ObjectId().toString(),
          ...cp,
          status: 'open',
          createdAt: new Date(),
        }];
      }
    }

    await user.save();
    return user.toPublicJSON();
  }

  async forgotPassword(data) {
    const user = await userRepo.findByEmailLowerCase(data.email);
    if (!user || user.isDeleted) {
      return { message: 'If that email exists, an OTP has been sent' };
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOtpEmail({ to: data.email, otp }).catch(() => {});
    return { message: 'OTP sent to your email' };
  }

  async verifyOtp(data) {
    const user = await userRepo.findByEmailLowerCase(data.email);
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      const err = new Error('Invalid or expired OTP'); err.status = 400; throw err;
    }
    if (user.resetOtpExpiry < new Date()) {
      const err = new Error('OTP has expired. Request a new one.'); err.status = 400; throw err;
    }
    if (user.resetOtp !== data.otp.trim()) {
      const err = new Error('Incorrect OTP'); err.status = 400; throw err;
    }
    return { message: 'OTP verified' };
  }

  async resetPassword(data) {
    const user = await userRepo.findByEmailLowerCase(data.email);
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      const err = new Error('Invalid or expired OTP'); err.status = 400; throw err;
    }
    if (user.resetOtpExpiry < new Date()) {
      const err = new Error('OTP has expired. Request a new one.'); err.status = 400; throw err;
    }
    if (user.resetOtp !== data.otp.trim()) {
      const err = new Error('Incorrect OTP'); err.status = 400; throw err;
    }
    user.password = data.password;
    user.markModified('password');
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();
    return { message: 'Password reset successfully' };
  }

  async googleCallback(user) {
    const token = signToken(user._id);
    const dbUser = await userRepo.findById(user._id);
    
    if (dbUser && dbUser.isBlocked) {
      return { url: `${process.env.CLIENT_URL}/login?error=blocked` };
    }

    let dest = '/select-role';
    let fromOnboarding = false;

    if (dbUser.role === 'admin') dest = '/admin';
    else if (dbUser.onboardingComplete) {
      if (dbUser.userType === 'recruiter') dest = dbUser.companyName ? '/find-developers' : '/client-profile';
      else if (dbUser.userType === 'client') dest = '/client-profile';
      else if (dbUser.userType === 'mentee') dest = '/developers';
      else if (dbUser.userType === 'developer') {
        const profileComplete = !!(dbUser.cvUrl && dbUser.cvUrl.trim());
        if (!profileComplete) { dest = '/profile'; fromOnboarding = true; }
        else dest = '/feed';
      }
    }

    const query = fromOnboarding ? `?token=${token}&fromOnboarding=true` : `?token=${token}`;
    return { url: `${process.env.CLIENT_URL}${dest}${query}` };
  }
}

module.exports = new AuthService();
