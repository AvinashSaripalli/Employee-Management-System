const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, auditLogController.getAuditLogs);

module.exports = router;
