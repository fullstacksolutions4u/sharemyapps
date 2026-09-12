const MentorshipOpportunity = require('../models/MentorshipOpportunity');
const Message = require('../models/Message');

class MentorshipOpportunityRepository {
  async getAllAdmin() {
    return await MentorshipOpportunity.find()
      .populate('interests', 'name email avatar regNumber userType')
      .sort({ createdAt: -1 });
  }

  async create(data) {
    return await MentorshipOpportunity.create(data);
  }

  async update(id, data) {
    return await MentorshipOpportunity.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id) {
    return await MentorshipOpportunity.findByIdAndDelete(id);
  }

  async findById(id) {
    return await MentorshipOpportunity.findById(id);
  }

  async saveOpportunity(item) {
    return await item.save();
  }

  async createMessage(data) {
    return await Message.create(data);
  }
}

module.exports = new MentorshipOpportunityRepository();
