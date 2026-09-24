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
 */
function calculateDuration(clockInTime, clockOutTime = '23:59:00') {
  if (!clockInTime) return '00:00:00';
  const [ih, im, is] = String(clockInTime).split(':').map(Number);
  const [oh, om, os] = String(clockOutTime).split(':').map(Number);

  const inSec = (ih || 0) * 3600 + (im || 0) * 60 + (is || 0);
  const outSec = (oh || 0) * 3600 + (om || 0) * 60 + (os || 0);

  const diffSec = Math.max(0, outSec - inSec);
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');

  return `${hrs}:${mins}:${secs}`;
}

/**
 * Automatically clocks out any unclosed attendance records:
 * 1. From previous days (clockInDate < today) -> auto clock out at 23:59:00 of that day.
 * 2. From today if the current time is past 23:59:00 -> auto clock out at 23:59:00.
 *
 * @param {string} [employeeIdFilter] - Optional employeeId to target a specific user.
 * @returns {Promise<{ count: number, updatedRecords: Array }>}
 */
async function autoClockOutStaleRecords(employeeIdFilter = null) {
  try {
    const today = getLocalDateString();
    const currentTime = getLocalTimeString();

    const whereClause = {
      clockOutTime: null,
      [Op.or]: [
        { clockInDate: { [Op.lt]: today } },
        ...(currentTime >= '23:59:00' ? [{ clockInDate: today }] : []),
      ],
    };

    if (employeeIdFilter) {
      whereClause.employeeId = employeeIdFilter;
    }

    const staleRecords = await Attendance.findAll({
      where: whereClause,
      order: [['id', 'ASC']],
    });

    if (!staleRecords || staleRecords.length === 0) {
      return { count: 0, updatedRecords: [] };
    }

    const updatedRecords = [];

    for (const record of staleRecords) {
      const clockIn = record.clockInTime || '09:00:00';
      const autoOutTime = '23:59:00';
      const computedWorkedTime = calculateDuration(clockIn, autoOutTime);

      await record.update({
        clockOutTime: autoOutTime,
        workedTime: computedWorkedTime,
      });

      console.log(
        `[AutoClockOut] Auto clocked out ID ${record.id} (${record.employeeId} - ${record.firstName} ${record.lastName}) on ${record.clockInDate}: In ${clockIn} -> Out ${autoOutTime} (Worked: ${computedWorkedTime})`
      );

      updatedRecords.push({
        id: record.id,
        employeeId: record.employeeId,
        date: record.clockInDate,
        clockInTime: clockIn,
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
