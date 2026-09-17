const { Attendance } = require('../models');
const { Op, fn, literal } = require('sequelize');

exports.clockIn = async (req, res) => {
  const {
    companyName, department, firstName, lastName, email, employeeId, designation, clockInDate, clockInTime
  } = req.body;

  try {
    await Attendance.create({
      companyName, department, firstName, lastName, email, employeeId,
      designation, clockInDate, clockInTime,
    });
    res.status(201).json({ message: 'Clock-in recorded' });
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'Failed to record clock-in', details: error.message });
  }
};

exports.clockOut = async (req, res) => {
  const { employeeId, companyName, clockOutTime, workedTime } = req.body;

  if (!employeeId || !companyName || !clockOutTime || !workedTime) {
    return res.status(400).json({ error: 'Missing required fields for clock-out.' });
  }

  try {
    const activeRecord = await Attendance.findOne({
      where: {
        employeeId,
        companyName,
        clockOutTime: null,
      },
      order: [['clockInTime', 'DESC']],
    });

    if (!activeRecord) {
      return res.status(404).json({ error: 'No active clock-in found for this user.' });
    }

    const clockInTime = activeRecord.clockInTime;
    if (new Date(`1970-01-01T${clockOutTime}Z`) <= new Date(`1970-01-01T${clockInTime}Z`)) {
      return res.status(400).json({ error: 'Clock-out time must be after clock-in time.' });
    }

    const result = await Attendance.update(
      { clockOutTime, workedTime },
      { where: { id: activeRecord.id, clockOutTime: null } }
    );

    if (result[0] === 0) {
      return res.status(404).json({ error: 'No active clock-in found to update.' });
    }

    res.json({ message: 'Clock-out successfully recorded.' });
  } catch (error) {
    console.error('Database error during clock-out:', error.message);
    res.status(500).json({ error: 'Failed to record clock-out.' });
  }
};

exports.getAllAttendances = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await Attendance.findAll({
      where: { companyName },
      order: [['clockInDate', 'DESC']],
    });
    res.json(results);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAttendanceStats = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await Attendance.findAll({
      attributes: [
        [literal('"clock_in_date"'), 'date'],
        [fn('SUM', literal(`CASE WHEN "clock_in_time" <= '09:30:00' THEN 1 ELSE 0 END`)), 'onTime'],
        [fn('SUM', literal(`CASE WHEN "clock_in_time" > '09:30:00' THEN 1 ELSE 0 END`)), 'late'],
        [fn('COUNT', literal('*')), 'total'],
      ],
      where: {
        companyName,
        [Op.and]: literal(`"clock_in_date" >= CURRENT_DATE - INTERVAL '6 days'`),
      },
      group: [literal('"clock_in_date"')],
      order: [[literal('"clock_in_date"'), 'ASC']],
      raw: true,
    });
    const stats = results.map(row => ({
      date: row.date,
      onTime: Number(row.onTime) || 0,
      late: Number(row.late) || 0,
      total: Number(row.total) || 0,
    }));
    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};