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
    const last = await User.findOne({ regNumber: { $exists: true } })
      .sort({ regNumber: -1 })
      .select('regNumber');
    return last?.regNumber ? last.regNumber + 1 : 101;
  }

  async create(data) {
    return await User.create(data);
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
