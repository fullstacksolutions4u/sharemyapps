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

const User = require('../models/User');

router.post('/claim-coin-discount', protect, async (req, res) => {
  try {
    if (req.user.hasCoinDiscount) {
      return res.status(400).json({ message: 'Discount already claimed.' });
    }
    if (req.user.points < 500) {
      return res.status(400).json({ message: 'You need at least 500 coins to claim this discount.' });
    }
    
    req.user.hasCoinDiscount = true;
    await req.user.save();
    
    res.json({ success: true, message: '30% discount claimed successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
