const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findByEmailLowerCase(email) {
    return await User.findOne({ email: email.toLowerCase().trim() });
  }

  async findLastRegNumber() {
    const count = await User.countDocuments();
    const last = await User.findOne({ regNumber: { $exists: true } })
      .sort({ regNumber: -1 })
      .select('regNumber');
    const maxReg = last?.regNumber || 0;
    return Math.max(count + 1, maxReg + 1);
  }

  async create(data) {
    return await User.create(data);
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
