const freelanceRepo = require('../repositories/freelanceOpportunity.repository');

class FreelanceOpportunityService {
  async getAllAdmin() {
    return await freelanceRepo.getAllAdmin();
  }

  async create(userId, data) {
    return await freelanceRepo.create({ ...data, createdBy: userId });
  }

  async update(id, data) {
    const item = await freelanceRepo.update(id, data);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return item;
  }

  async remove(id) {
    await freelanceRepo.remove(id);
    return { message: 'Deleted' };
  }

  async toggleStatus(id) {
    const item = await freelanceRepo.findById(id);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    item.status = item.status === 'active' ? 'closed' : 'active';
    await freelanceRepo.saveOpportunity(item);
    return { status: item.status };
  }

  async replyToInterest(adminId, data) {
    await freelanceRepo.createMessage({ sender: adminId, recipient: data.userId, text: data.message });
    return { message: 'Sent' };
  }

  async showInterest(id, userId) {
    const item = await freelanceRepo.findById(id);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    const uid = userId.toString();
    const idx = item.interests.findIndex(i => i.toString() === uid);
    let interested;
    if (idx === -1) {
      item.interests.push(userId);
      interested = true;
    } else {
      item.interests.splice(idx, 1);
      interested = false;
    }
    await freelanceRepo.saveOpportunity(item);
    return { interested, interestCount: item.interests.length };
  }
}

module.exports = new FreelanceOpportunityService();
