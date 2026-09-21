const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const workController = require('../controllers/workController');

router.get('/', verifyToken, workController.getWorkGroups);
router.post('/', verifyToken, workController.createWorkGroup);
router.put('/:id', verifyToken, workController.updateWorkGroup);
router.delete('/:id', verifyToken, workController.deleteWorkGroup);

// Self-service membership
router.post('/:id/join', verifyToken, workController.joinWorkGroup);
router.post('/:id/leave', verifyToken, workController.leaveWorkGroup);

// Role management
router.patch('/:id/member-role', verifyToken, workController.updateMemberRole);

// Noticeboard / Announcements
router.post('/:id/announcements', verifyToken, workController.addAnnouncement);
router.delete('/:id/announcements/:announcementId', verifyToken, workController.deleteAnnouncement);

// Shared Resources
router.post('/:id/resources', verifyToken, workController.addResource);
router.delete('/:id/resources/:resourceId', verifyToken, workController.deleteResource);

module.exports = router;