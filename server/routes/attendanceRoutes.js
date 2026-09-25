const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const permissionController = require('../controllers/permissionController');

router.post('/clock-in', attendanceController.clockIn);
router.patch('/clock-out', attendanceController.clockOut);
router.get('/status', attendanceController.getAttendanceStatus);
router.get('/', attendanceController.getAllAttendances);
router.get('/stats', attendanceController.getAttendanceStats);

// Attendance Permissions & Regularization routes
router.post('/permissions/apply', permissionController.applyPermission);
router.get('/permissions/my', permissionController.getMyPermissions);
router.get('/permissions/approvals', permissionController.getPermissionApprovals);
router.patch('/permissions/:id/review', permissionController.reviewPermission);
router.patch('/permissions/:id/cancel', permissionController.cancelPermission);
router.get('/permissions/active-today', permissionController.getActiveTodayPermission);

module.exports = router;
