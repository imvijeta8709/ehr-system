const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications, markAllRead, markRead, deleteOne, deleteAll,
} = require('../controllers/notificationController');

router.get('/',              protect, getNotifications);
router.put('/read-all',      protect, markAllRead);
router.put('/:id/read',      protect, markRead);
router.delete('/all',        protect, deleteAll);
router.delete('/:id',        protect, deleteOne);

module.exports = router;
