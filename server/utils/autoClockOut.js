const { Attendance } = require('../models');
const { Op } = require('sequelize');

/**
 * Returns the current date in YYYY-MM-DD format according to local time.
 */
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current time in HH:mm:ss format according to local time.
 */
function getLocalTimeString() {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

/**
 * Computes difference in HH:mm:ss between clockInTime and clockOutTime (both HH:mm:ss).
 * If clockInDate and clockOutDate differ (cross-midnight shift), accurately computes span.
 */
function calculateDuration(clockInTime, clockOutTime = '23:59:00', clockInDate = null, clockOutDate = null) {
  if (!clockInTime) return '00:00:00';

  if (clockInDate && clockOutDate && clockInDate !== clockOutDate) {
    const start = new Date(`${clockInDate}T${clockInTime}`);
    const end = new Date(`${clockOutDate}T${clockOutTime}`);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffSec = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      return `${hrs}:${mins}:${secs}`;
    }
  }

  const [ih, im, is] = String(clockInTime).split(':').map(Number);
  const [oh, om, os] = String(clockOutTime).split(':').map(Number);

  const inSec = (ih || 0) * 3600 + (im || 0) * 60 + (is || 0);
  let outSec = (oh || 0) * 3600 + (om || 0) * 60 + (os || 0);

  // If clock-out time is earlier than clock-in time on cross-midnight shift (e.g. in 22:00, out 06:30)
  if (outSec < inSec) {
    outSec += 24 * 3600;
  }

  const diffSec = Math.max(0, outSec - inSec);
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');

  return `${hrs}:${mins}:${secs}`;
}

/**
 * Automatically clocks out truly abandoned/stale attendance records:
 * - Shifts left open for 14 or more hours.
 * - Protects active shifts (including Night Shifts that cross midnight).
 */
async function autoClockOutStaleRecords(employeeIdFilter = null) {
  try {
    const today = getLocalDateString();
    const now = new Date();

    const whereClause = {
      clockOutTime: null,
    };

    if (employeeIdFilter) {
      whereClause.employeeId = employeeIdFilter;
    }

    const unclosedRecords = await Attendance.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
    });

    if (!unclosedRecords || unclosedRecords.length === 0) {
      return { count: 0, updatedRecords: [] };
    }

    const updatedRecords = [];

    for (const record of unclosedRecords) {
      const clockInDate = record.clockInDate || today;
      const clockInTime = record.clockInTime || '09:00:00';
      const inDateTime = new Date(`${clockInDate}T${clockInTime}`);

      if (isNaN(inDateTime.getTime())) continue;

      const diffMs = now.getTime() - inDateTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Night shift & active shift protection:
      // If the shift started less than 14 hours ago, the employee is still on duty. Do NOT auto clock out!
      if (diffHours < 14) {
        continue;
      }

      // Abandoned shift: Cap auto clock-out at 9 hours of work
      const autoOutDateTime = new Date(inDateTime.getTime() + 9 * 60 * 60 * 1000);
      const autoOutHrs = String(autoOutDateTime.getHours()).padStart(2, '0');
      const autoOutMins = String(autoOutDateTime.getMinutes()).padStart(2, '0');
      const autoOutSecs = String(autoOutDateTime.getSeconds()).padStart(2, '0');
      const autoOutTime = `${autoOutHrs}:${autoOutMins}:${autoOutSecs}`;
      const computedWorkedTime = '09:00:00';

      await record.update({
        clockOutTime: autoOutTime,
        workedTime: computedWorkedTime,
      });

      console.log(
        `[AutoClockOut] Auto clocked out stale shift ID ${record.id} (${record.employeeId} - ${record.firstName} ${record.lastName}) started ${clockInDate} ${clockInTime} (Diff: ${diffHours.toFixed(1)}h) -> Auto Out ${autoOutTime} (Worked: ${computedWorkedTime})`
      );

      updatedRecords.push({
        id: record.id,
        employeeId: record.employeeId,
        date: record.clockInDate,
        clockInTime,
        clockOutTime: autoOutTime,
        workedTime: computedWorkedTime,
      });
    }

    return { count: updatedRecords.length, updatedRecords };
  } catch (error) {
    console.error('[AutoClockOut] Error processing auto clock-out:', error);
    return { count: 0, error: error.message };
  }
}

/**
 * Initializes a background scheduler that checks every minute for records needing auto-clockout.
 */
function initAutoClockOutScheduler() {
  // Run check immediately on start
  autoClockOutStaleRecords().catch((err) => {
    console.error('[AutoClockOut] Error in startup check:', err);
  });

  // Check every 60 seconds (1 minute)
  const intervalId = setInterval(() => {
    autoClockOutStaleRecords().catch((err) => {
      console.error('[AutoClockOut] Error in scheduled interval check:', err);
    });
  }, 60 * 1000);

  return intervalId;
}

module.exports = {
  getLocalDateString,
  getLocalTimeString,
  calculateDuration,
  autoClockOutStaleRecords,
  initAutoClockOutScheduler,
};
