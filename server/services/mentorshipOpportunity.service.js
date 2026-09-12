const mentorshipRepo = require('../repositories/mentorshipOpportunity.repository');

class MentorshipOpportunityService {
  async getAllAdmin() {
    return await mentorshipRepo.getAllAdmin();
  }

  async create(userId, data) {
    return await mentorshipRepo.create({ ...data, createdBy: userId });
  }

  async update(id, data) {
    const item = await mentorshipRepo.update(id, data);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return item;
  }

  async remove(id) {
    await mentorshipRepo.remove(id);
    return { message: 'Deleted' };
  }

  async toggleStatus(id) {
    const item = await mentorshipRepo.findById(id);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    item.status = item.status === 'active' ? 'closed' : 'active';
    await mentorshipRepo.saveOpportunity(item);
    return { status: item.status };
  }

  async replyToInterest(adminId, data) {
    await mentorshipRepo.createMessage({ sender: adminId, recipient: data.userId, text: data.message });
    return { message: 'Sent' };
  }

  async showInterest(id, userId) {
    const item = await mentorshipRepo.findById(id);
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
    await mentorshipRepo.saveOpportunity(item);
    return { interested, interestCount: item.interests.length };
  }
}

module.exports = new MentorshipOpportunityService();
