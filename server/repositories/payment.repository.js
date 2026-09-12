const Payment = require('../models/Payment');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Notification = require('../models/Notification');
const MentorshipApplication = require('../models/MentorshipApplication');

class PaymentRepository {
  async findPlanById(planId) {
    return await Plan.findById(planId).lean();
  }

  async findExistingPlacementPayment(userId, packName) {
    return await Payment.findOne({ user: userId, status: 'success', pack: packName }).lean();
  }

  async findMentorshipApplication(userId) {
    return await MentorshipApplication.findOne({ user: userId }).lean();
  }

  async createPayment(data) {
    return await Payment.create(data);
  }

  async incrementUserJdQuota(userId, amount) {
    return await User.updateOne({ _id: userId }, { $inc: { 'jdQuota.paidRemaining': amount } });
  }

  async getUserJdQuota(userId) {
    return await User.findById(userId).select('jdQuota').lean();
  }

  async getAdminPayments(skip, limit) {
    const [payments, total] = await Promise.all([
      Payment.find({ status: 'success' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email userType')
        .lean(),
      Payment.countDocuments({ status: 'success' }),
    ]);
    return { payments, total };
  }

  async getAdminRevenue() {
    const [revenueResult] = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
    ]);
    return revenueResult || { total: 0, count: 0 };
  }

  async deletePayment(id) {
    return await Payment.findByIdAndDelete(id);
  }

  async updateUserJobLinkAccess(userId, paymentId) {
    await User.updateOne({ _id: userId }, { $pull: { premiumServices: { key: 'job_link_unlimited_apply' } } });
    await User.updateOne({ _id: userId }, {
      $push: { premiumServices: { key: 'job_link_unlimited_apply', notes: `Payment: ${paymentId}` } },
    });
  }

  async createNotification(data) {
    return await Notification.create(data);
  }

  async getPlacementPurchases(userId) {
    return await Payment.find({
      user: userId,
      status: 'success',
      pack: /^placement_/,
    }).select('pack amountPaise createdAt').lean();
  }

  async getUserById(userId) {
    return await User.findById(userId).select('name email').lean();
  }
}

module.exports = new PaymentRepository();
