const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getInbox, getSent, markRead, markAllRead, replyMessage, sendToAdmin } = require('../controllers/messageController');

router.use(protect);
router.get('/', getInbox);
router.get('/sent', getSent);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.post('/admin', sendToAdmin);
router.post('/:id/reply', replyMessage);

module.exports = router;
