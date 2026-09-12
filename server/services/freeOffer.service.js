const freeOfferRepo = require('../repositories/freeOffer.repository');
const { sendActivationEmail } = require('../utils/email');

class FreeOfferService {
  async applyForFreeOffer(userId) {
    const existing = await freeOfferRepo.findOfferByUser(userId);
    if (existing) {
      const err = new Error('You have already applied.'); err.status = 400; throw err;
    }
    return await freeOfferRepo.createOffer({ user: userId });
  }

  async getMyOffer(userId) {
    return await freeOfferRepo.findOfferByUserLean(userId);
  }

  async adminGetOffers(pageParam, statusParam) {
    const page = Math.max(1, parseInt(pageParam) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const filter = statusParam ? { status: statusParam } : {};

    const { offers, total } = await freeOfferRepo.getAdminOffers(skip, limit, filter);
    return { offers, total, page, pages: Math.ceil(total / limit) };
  }

  async adminUpdateOffer(id, adminUserId, data) {
    const update = {};
    if (data.status) update.status = data.status;
    if (data.offerDueDate !== undefined) update.offerDueDate = data.offerDueDate || null;
    if (data.adminNote !== undefined) update.adminNote = data.adminNote;

    const offer = await freeOfferRepo.updateOffer(id, update);
    if (!offer) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }

    if (data.status === 'approved') {
      await this.activateUserPremiumAccess(offer.user._id, adminUserId, { sendEmail: false });
    }

    return offer;
  }

  async adminDeleteOffer(id) {
    const offer = await freeOfferRepo.deleteOffer(id);
    if (!offer) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return { message: 'Deleted' };
  }

  async adminGetOfferStats() {
    return await freeOfferRepo.getOfferStats();
  }

  async adminToggleEnroll(id) {
    const offer = await freeOfferRepo.findOfferByIdLean(id);
    if (!offer) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    const newEnrolled = !offer.enrolled;
    return await freeOfferRepo.updateOffer(id, {
      enrolled: newEnrolled,
      enrolledAt: newEnrolled ? new Date() : null,
    });
  }

  async ensureActivatedOffer(userId) {
    let offer = await freeOfferRepo.findOfferByUser(userId);
    if (offer) {
      offer.status = 'approved';
      offer.enrolled = true;
      if (!offer.enrolledAt) offer.enrolledAt = new Date();
      await freeOfferRepo.saveOffer(offer);
      return offer;
    }
    return await freeOfferRepo.createOffer({
      user: userId,
      status: 'approved',
      enrolled: true,
      enrolledAt: new Date(),
    });
  }

  async activateUserPremiumAccess(userId, adminUserId, { notes = 'Auto-unlocked on activation', sendEmail = true } = {}) {
    const user = await freeOfferRepo.getUserById(userId);
    if (!user) return null;
    
    await this.ensureActivatedOffer(userId);
    
    const allServices = await freeOfferRepo.getAllPremiumServices();
    const existing = new Set(user.premiumServices.map(s => s.key));
    for (const svc of allServices) {
      if (!existing.has(svc.key)) {
        user.premiumServices.push({ key: svc.key, notes, unlockedBy: adminUserId });
      }
    }
    
    await user.save();
    if (sendEmail) sendActivationEmail({ to: user.email, name: user.name }).catch(() => {});
    return user;
  }

  async adminActivate(id, adminUserId) {
    const offer = await freeOfferRepo.findOfferByIdLean(id);
    if (!offer) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }

    const activate = offer.status !== 'approved' || !offer.enrolled;
    const update = activate
      ? { status: 'approved', enrolled: true, enrolledAt: new Date() }
      : { status: 'pending', enrolled: false, enrolledAt: null };

    const updated = await freeOfferRepo.updateOffer(id, update);

    if (activate) {
      await this.activateUserPremiumAccess(offer.user._id, adminUserId, { sendEmail: true });
    }

    return updated;
  }

  async adminMarkWhatsappContacted(id) {
    const offer = await freeOfferRepo.updateOffer(id, {
      whatsappContacted: true,
      whatsappContactedAt: new Date(),
    });
    if (!offer) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return offer;
  }

  async adminGetOfferPortfolio(id) {
    const data = await freeOfferRepo.getOfferPortfolio(id);
    if (!data) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return data;
  }
}

module.exports = new FreeOfferService();
