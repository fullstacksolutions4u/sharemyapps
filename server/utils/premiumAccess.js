const User = require('../models/User');
const FreeOffer = require('../models/FreeOffer');

/** Premium access via admin grant, payment, or activated placement membership. */
async function getPremiumAccess(userId) {
  const Payment = require('../models/Payment');

  const [user, offer, payment] = await Promise.all([
    User.findById(userId).select('premiumServices freePremiumGrant').lean(),
    FreeOffer.findOne({ user: userId, $or: [{ enrolled: true }, { status: 'approved' }] }).lean(),
    Payment.findOne({ user: userId, status: 'success', pack: /^placement_/ }).sort({ createdAt: 1 }).lean(),
  ]);

  const hasPlacementSession = user?.premiumServices?.some(s => s.key === 'placement_session');
  const hasAnyPremium = (user?.premiumServices?.length || 0) > 0;
  const hasGrant = user?.freePremiumGrant?.granted;
  const hasAccess = hasPlacementSession || hasAnyPremium || hasGrant || !!offer || !!payment;

  let since = null;
  if (offer?.enrolledAt) since = offer.enrolledAt;
  else if (user?.freePremiumGrant?.grantedAt) since = user.freePremiumGrant.grantedAt;
  else if (payment?.createdAt) since = payment.createdAt;
  else if (hasPlacementSession) {
    const ps = user?.premiumServices?.find(s => s.key === 'placement_session');
    if (ps?.unlockedAt) since = ps.unlockedAt;
  }

  return { hasAccess, since };
}

module.exports = { getPremiumAccess };
