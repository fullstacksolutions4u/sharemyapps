const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  userType: { type: String, enum: ['developer', 'client', 'recruiter', 'mentee', 'mentor'], default: 'developer' },
  onboardingComplete: { type: Boolean, default: false },
  phone: { type: String, trim: true, default: '' },
  linkedinUrl: { type: String, trim: true, default: '' },
  githubUrl: { type: String, trim: true, default: '' },
  leetcodeUrl: { type: String, trim: true, default: '' },
  portfolioUrl: { type: String, trim: true, default: '' },
  cvUrl: { type: String, trim: true, default: '' },
  bio: { type: String, trim: true, default: '' },
  // Client-specific fields
  companyName: { type: String, trim: true, default: '' },
  companyWebsite: { type: String, trim: true, default: '' },
  industry: { type: String, trim: true, default: '' },
  requirements: { type: String, trim: true, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  designations: [{ type: String, trim: true }],
  freelanceAvailable: { type: Boolean, default: false },
  freelanceRate: { type: Number, default: null },
  mentorshipAvailable: { type: Boolean, default: false },
  mentorshipRate: { type: Number, default: null },
  mentorshipTech: [{ type: String, trim: true }],
  mentorshipSchedule: { type: mongoose.Schema.Types.Mixed, default: null },
  languagePreference: [{ type: String, trim: true }],
  badge: { type: String, enum: ['new_member', 'active', 'top', 'champion'], default: 'new_member' },
  regNumber: { type: Number, unique: true, sparse: true },
  hidden: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  joiningAvailability: { type: String, trim: true, default: '' },
  currentSalary: { type: Number, default: null },
  expectedSalary: { type: Number, default: null },
  preferredLocations: [{ type: String, trim: true }],
  jobMode: [{ type: String, trim: true }],
  yearsOfExperience: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  place: { type: String, trim: true, default: '' },
  district: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date, default: null },
  resumeData: { type: mongoose.Schema.Types.Mixed, default: null },
  menteeProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  clientProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  clientProjects: [{ type: mongoose.Schema.Types.Mixed }],
  aiUsageCount: { type: Number, default: 0 },
  aiUsageDate:  { type: String, default: '' },
  resetOtp:       { type: String, default: null },
  resetOtpExpiry: { type: Date,   default: null },
}, { timestamps: true });

userSchema.index({ userType: 1, hidden: 1, isDeleted: 1 });
userSchema.index({ role: 1 });
userSchema.index({ mentorshipAvailable: 1, hidden: 1, isDeleted: 1 });
userSchema.index({ freelanceAvailable: 1, hidden: 1, isDeleted: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    userType: this.userType,
    phone: this.phone,
    linkedinUrl: this.linkedinUrl,
    githubUrl: this.githubUrl,
    leetcodeUrl: this.leetcodeUrl,
    portfolioUrl: this.portfolioUrl,
    cvUrl: this.cvUrl,
    companyName: this.companyName,
    companyWebsite: this.companyWebsite,
    industry: this.industry,
    requirements: this.requirements,
    isGoogleUser: !!this.googleId,
    createdAt: this.createdAt,
    followersCount: this.followers?.length || 0,
    badge: this.badge || 'new_member',
    bio: this.bio || '',
    designations: this.designations || [],
    freelanceAvailable: this.freelanceAvailable || false,
    freelanceRate: this.freelanceRate ?? null,
    mentorshipAvailable: this.mentorshipAvailable || false,
    mentorshipRate: this.mentorshipRate ?? null,
    mentorshipTech: this.mentorshipTech || [],
    mentorshipSchedule: this.mentorshipSchedule || null,
    languagePreference: this.languagePreference || [],
    regNumber: this.regNumber,
    joiningAvailability: this.joiningAvailability || '',
    currentSalary: this.currentSalary ?? null,
    expectedSalary: this.expectedSalary ?? null,
    preferredLocations: this.preferredLocations || [],
    jobMode: this.jobMode || [],
    yearsOfExperience: this.yearsOfExperience || '',
    menteeProfile: this.menteeProfile || null,
    clientProfile: this.clientProfile || null,
    clientProjects: this.clientProjects || [],
    gender: this.gender || '',
    place: this.place || '',
    district: this.district || '',
    state: this.state || '',
    country: this.country || '',
    dateOfBirth: this.dateOfBirth ?? null,
    isDeleted: this.isDeleted || false,
    deletedAt: this.deletedAt ?? null,
    onboardingComplete: this.onboardingComplete || false,
  };
};

module.exports = mongoose.model('User', userSchema);
