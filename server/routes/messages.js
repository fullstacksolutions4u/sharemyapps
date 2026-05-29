const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getInbox, getSent, markRead, markAllRead } = require('../controllers/messageController');

router.use(protect);
router.get('/', getInbox);
router.get('/sent', getSent);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);

module.exports = router;
