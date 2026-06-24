const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { applyForFreeOffer, getMyOffer } = require('../controllers/freeOfferController');
const SiteConfig = require('../models/SiteConfig');

router.get('/config', async (_req, res) => {
  try {
    const doc = await SiteConfig.findOne({ key: 'main' }).lean();
    res.json({
      freeOfferEnabled: doc?.freeOfferEnabled ?? true,
      freeOfferDueDate: doc?.freeOfferDueDate ?? null,
    });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/apply', protect, applyForFreeOffer);
router.get('/my-offer', protect, getMyOffer);

module.exports = router;
