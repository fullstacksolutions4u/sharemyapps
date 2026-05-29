const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String, trim: true, default: '' },
  linkedinUrl: { type: String, trim: true, default: '' },
  githubUrl: { type: String, trim: true, default: '' },
  leetcodeUrl: { type: String, trim: true, default: '' },
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
    phone: this.phone,
    linkedinUrl: this.linkedinUrl,
    githubUrl: this.githubUrl,
    leetcodeUrl: this.leetcodeUrl,
    isGoogleUser: !!this.googleId,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
