const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.dismissNotification);

module.exports = router;
