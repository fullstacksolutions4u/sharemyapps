const paymentRepo = require('../repositories/payment.repository');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { getConfig } = require('../utils/configCache');
const { sendPlacementPaymentEmail } = require('../utils/email');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  verifySignature(orderId, paymentId, signature) {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (expected !== signature) {
      const err = new Error('Payment verification failed.'); err.status = 400; throw err;
    }
  }

  async createJDPackOrder(userId) {
    const cfg = await getConfig();
    const order = await this.razorpay.orders.create({
      amount: cfg.jdPackPricePaise,
      currency: 'INR',
      receipt: `jd_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: userId.toString(), pack: `jd_${cfg.jdPaidPackSize}` },
    });
    return { orderId: order.id, amount: order.amount, currency: order.currency };
  }

  async verifyJDPackPayment(userId, data) {
    this.verifySignature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
    
    const cfg = await getConfig();
    await paymentRepo.incrementUserJdQuota(userId, cfg.jdPaidPackSize);
    
    await paymentRepo.createPayment({
      user: userId,
      razorpayOrderId: data.razorpay_order_id,
      razorpayPaymentId: data.razorpay_payment_id,
      amountPaise: cfg.jdPackPricePaise,
      pack: `jd_${cfg.jdPaidPackSize}`,
      analysesGranted: cfg.jdPaidPackSize,
      status: 'success',
    });

    const updated = await paymentRepo.getUserJdQuota(userId);
    return {
      ok: true,
      paidRemaining: updated.jdQuota?.paidRemaining ?? cfg.jdPaidPackSize,
    };
  }

  async adminGetPayments(page = 1) {
    const limit = 20;
    const skip = (page - 1) * limit;

    const { payments, total } = await paymentRepo.getAdminPayments(skip, limit);
    const revenueResult = await paymentRepo.getAdminRevenue();

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalRevenuePaise: revenueResult.total,
      totalTransactions: revenueResult.count,
    };
  }

  async adminDeletePayment(id) {
    const payment = await paymentRepo.deletePayment(id);
    if (!payment) {
      const err = new Error('Payment not found'); err.status = 404; throw err;
    }
    return { message: 'Payment deleted' };
  }

  async createPlacementOrder(userId, data) {
    const plan = await paymentRepo.findPlanById(data.planId);
    if (!plan || !plan.active) {
      const err = new Error('Plan not found.'); err.status = 404; throw err;
    }

    const existing = await paymentRepo.findExistingPlacementPayment(userId, `placement_${plan.name.toLowerCase()}`);
    if (existing) {
      const err = new Error(`You have already purchased the ${plan.name} plan.`); err.status = 409; throw err;
    }

    if (plan.name === 'Mentorship') {
      const application = await paymentRepo.findMentorshipApplication(userId);
      if (!application || application.status !== 'approved') {
        const err = new Error('Your mentorship application must be verified by our team before payment.'); err.status = 403; throw err;
      }
    }

    const amountPaise = plan.price * 100;
    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `pl_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: userId.toString(), plan: plan.name },
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, planName: plan.name };
  }

  async verifyPlacementPayment(userId, data) {
    this.verifySignature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);

    const plan = await paymentRepo.findPlanById(data.planId);
    if (!plan) {
      const err = new Error('Plan not found.'); err.status = 404; throw err;
    }

    const isJobLinkPlan = plan.name === 'JobLinkUnlimited';
    const amountPaise = plan.price * 100;

    await paymentRepo.createPayment({
      user: userId,
      razorpayOrderId: data.razorpay_order_id,
      razorpayPaymentId: data.razorpay_payment_id,
      amountPaise: amountPaise,
      pack: `placement_${plan.name.toLowerCase()}`,
      analysesGranted: 0,
      status: 'success',
    });

    if (isJobLinkPlan) {
      await paymentRepo.updateUserJobLinkAccess(userId, data.razorpay_payment_id);
      await paymentRepo.createNotification({
        user: userId,
        type: 'payment_success',
        title: 'Unlimited Job Applies Unlocked 🎉',
        message: `Your ₹${plan.price} payment was successful. You now have unlimited Apply Now on Job Post Links.`,
      });
      return { ok: true, planName: plan.name, service: 'job_link_unlimited_apply' };
    }

    const { activateUserPremiumAccess } = require('../controllers/freeOfferController');
    await activateUserPremiumAccess(userId, userId, {
      notes: `Payment: ${data.razorpay_payment_id}`,
      sendEmail: false,
    });

    await paymentRepo.createNotification({
      user: userId,
      type: 'payment_success',
      title: 'Payment Successful 🎉',
      message: `Your ₹${plan.price} ${plan.name === 'Mentorship' ? 'Mentorship Program' : 'Placement Service'} payment was successful. Our HR team will contact you within 2 business days.`,
    });

    const user = await paymentRepo.getUserById(userId);
    sendPlacementPaymentEmail({
      to: user.email,
      name: user.name,
      plan,
    }).catch(err => console.error('Placement email error:', err));

    return { ok: true, planName: plan.name };
  }

  async getPlacementPurchases(userId) {
    return await paymentRepo.getPlacementPurchases(userId);
  }
}

module.exports = new PaymentService();
