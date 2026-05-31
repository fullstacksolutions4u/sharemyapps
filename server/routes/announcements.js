const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { getActive, getAll, getFeed, create, toggle, update, remove } = require('../controllers/announcementController');

router.get('/feed', getFeed);
router.get('/', getActive);
router.get('/all', protect, requireAdmin, getAll);
router.post('/', protect, requireAdmin, create);
router.patch('/:id/toggle', protect, requireAdmin, toggle);
router.patch('/:id', protect, requireAdmin, update);
router.delete('/:id', protect, requireAdmin, remove);

module.exports = router;
