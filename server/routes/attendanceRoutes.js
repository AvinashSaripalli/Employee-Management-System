const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const permissionController = require('../controllers/permissionController');
const regularizationController = require('../controllers/regularizationController');

router.post('/clock-in', attendanceController.clockIn);
router.patch('/clock-out', attendanceController.clockOut);
router.get('/status', attendanceController.getAttendanceStatus);
router.get('/', attendanceController.getAllAttendances);
router.get('/stats', attendanceController.getAttendanceStats);

// Attendance Permissions routes (Late In / Early Out short permissions)
router.post('/permissions/apply', permissionController.applyPermission);
router.get('/permissions/my', permissionController.getMyPermissions);
router.get('/permissions/approvals', permissionController.getPermissionApprovals);
router.patch('/permissions/:id/review', permissionController.reviewPermission);
router.patch('/permissions/:id/cancel', permissionController.cancelPermission);
router.get('/permissions/active-today', permissionController.getActiveTodayPermission);

// Attendance Regularization routes (Missed Punch / Full Day Regularization)
router.post('/regularization/apply', regularizationController.applyRegularization);
router.get('/regularization/my', regularizationController.getMyRegularizations);
router.get('/regularization/approvals', regularizationController.getRegularizationApprovals);
router.patch('/regularization/:id/review', regularizationController.reviewRegularization);
router.patch('/regularization/:id/cancel', regularizationController.cancelRegularization);
router.get('/regularization/check-date', regularizationController.checkDateAttendance);

module.exports = router;

