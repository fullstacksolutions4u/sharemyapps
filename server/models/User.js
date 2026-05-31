const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  userType: { type: String, enum: ['developer', 'client'], default: 'developer' },
  phone: { type: String, trim: true, default: '' },
  linkedinUrl: { type: String, trim: true, default: '' },
  githubUrl: { type: String, trim: true, default: '' },
  leetcodeUrl: { type: String, trim: true, default: '' },
  portfolioUrl: { type: String, trim: true, default: '' },
  cvUrl: { type: String, trim: true, default: '' },
  // Client-specific fields
  companyName: { type: String, trim: true, default: '' },
  companyWebsite: { type: String, trim: true, default: '' },
  industry: { type: String, trim: true, default: '' },
  requirements: { type: String, trim: true, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  badge: { type: String, enum: ['new_member', 'active', 'top', 'champion'], default: 'new_member' },
  regNumber: { type: Number, unique: true, sparse: true },
}, { timestamps: true });

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
    regNumber: this.regNumber,
  };
};

module.exports = mongoose.model('User', userSchema);
