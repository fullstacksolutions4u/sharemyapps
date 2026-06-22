const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { applyForFreeOffer, getMyOffer } = require('../controllers/freeOfferController');
const { getConfig } = require('../utils/configCache');

router.get('/config', async (_req, res) => {
  try {
    const config = await getConfig();
    res.json({ freeOfferEnabled: config.freeOfferEnabled, freeOfferDueDate: config.freeOfferDueDate });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/apply', protect, applyForFreeOffer);
router.get('/my-offer', protect, getMyOffer);

module.exports = router;
