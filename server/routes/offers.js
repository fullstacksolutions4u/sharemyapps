const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { applyForFreeOffer, getMyOffer } = require('../controllers/freeOfferController');
const SiteConfig = require('../models/SiteConfig');

router.get('/config', async (_req, res) => {
  try {
    const doc = await SiteConfig.findOne({ key: 'main' }).lean();
    res.json({
      freeOfferEnabled:         doc?.freeOfferEnabled ?? true,
      freeOfferDueDate:         doc?.freeOfferDueDate ?? null,
      premiumServicePricePaise: doc?.premiumServicePricePaise ?? 99900,
      rank1OfferPricePaise:     doc?.rank1OfferPricePaise ?? 49900,
    });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/apply', protect, applyForFreeOffer);
router.get('/my-offer', protect, getMyOffer);

// Whether an admin granted the calling user free premium access (invitation to apply)
router.get('/my-grant', protect, (req, res) => {
  res.json({ granted: !!req.user.freePremiumGrant?.granted });
});

module.exports = router;
