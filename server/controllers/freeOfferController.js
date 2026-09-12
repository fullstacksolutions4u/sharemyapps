const freeOfferService = require('../services/freeOffer.service');
const FreeOfferDto = require('../dtos/freeOffer.dto');

async function applyForFreeOffer(req, res) {
  try {
    const offer = await freeOfferService.applyForFreeOffer(req.user._id);
    res.status(201).json(offer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

async function getMyOffer(req, res) {
  try {
    const offer = await freeOfferService.getMyOffer(req.user._id);
    res.json(offer || null);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminGetOffers(req, res) {
  try {
    const result = await freeOfferService.adminGetOffers(req.query.page, req.query.status);
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminUpdateOffer(req, res) {
  try {
    const data = FreeOfferDto.validateAdminUpdate(req.body);
    const offer = await freeOfferService.adminUpdateOffer(req.params.id, req.user._id, data);
    res.json(offer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminDeleteOffer(req, res) {
  try {
    const result = await freeOfferService.adminDeleteOffer(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminGetOfferStats(req, res) {
  try {
    const stats = await freeOfferService.adminGetOfferStats();
    res.json(stats);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminToggleEnroll(req, res) {
  try {
    const updated = await freeOfferService.adminToggleEnroll(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

async function activateUserPremiumAccess(userId, adminUserId, options = {}) {
  // Exported for use in other controllers/services (e.g., payment)
  return await freeOfferService.activateUserPremiumAccess(userId, adminUserId, options);
}

async function adminActivate(req, res) {
  try {
    const updated = await freeOfferService.adminActivate(req.params.id, req.user._id);
    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminMarkWhatsappContacted(req, res) {
  try {
    const offer = await freeOfferService.adminMarkWhatsappContacted(req.params.id);
    res.json(offer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminGetOfferPortfolio(req, res) {
  try {
    const result = await freeOfferService.adminGetOfferPortfolio(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  applyForFreeOffer, getMyOffer, adminGetOffers, adminUpdateOffer, adminDeleteOffer,
  adminGetOfferStats, adminGetOfferPortfolio, adminMarkWhatsappContacted, adminToggleEnroll,
  adminActivate, activateUserPremiumAccess,
};
