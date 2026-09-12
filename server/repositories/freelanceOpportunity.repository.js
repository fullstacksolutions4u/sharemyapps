const FreelanceOpportunity = require('../models/FreelanceOpportunity');
const Message = require('../models/Message');

class FreelanceOpportunityRepository {
  async getAllAdmin() {
    return await FreelanceOpportunity.find()
      .populate('interests', 'name email avatar regNumber userType')
      .sort({ createdAt: -1 });
  }

  async create(data) {
    return await FreelanceOpportunity.create(data);
  }

  async update(id, data) {
    return await FreelanceOpportunity.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id) {
    return await FreelanceOpportunity.findByIdAndDelete(id);
  }

  async findById(id) {
    return await FreelanceOpportunity.findById(id);
  }

  async saveOpportunity(item) {
    return await item.save();
  }

  async createMessage(data) {
    return await Message.create(data);
  }
}

module.exports = new FreelanceOpportunityRepository();
