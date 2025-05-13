const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/clock-in', attendanceController.clockIn);
router.patch('/clock-out', attendanceController.clockOut);
router.get('/', attendanceController.getAllAttendances);

module.exports = router;
