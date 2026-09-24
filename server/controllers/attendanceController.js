const { Attendance, User } = require('../models');
const { Op, fn, literal } = require('sequelize');
const { autoClockOutStaleRecords } = require('../utils/autoClockOut');

exports.getAttendanceStatus = async (req, res) => {
  const { employeeId, companyName, date } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const rawCompany = String(companyName || '').trim();
  const effectiveCompany =
    !rawCompany || rawCompany === 'null' || rawCompany === 'undefined'
      ? 'KN Advisors'
      : rawCompany;

  const targetDate = date || new Date().toISOString().slice(0, 10);

  try {
    // Auto-clockout any stale previous-day shifts before querying status
    await autoClockOutStaleRecords(employeeId);

    const activeRecord = await Attendance.findOne({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        clockOutTime: null,
      },
      order: [['id', 'DESC']],
    });

    const dateRecords = await Attendance.findAll({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        clockInDate: targetDate,
      },
      order: [['id', 'ASC']],
    });

    const latestTodayRecord = dateRecords.length > 0 ? dateRecords[dateRecords.length - 1] : null;
    const isCompleted = !activeRecord && Boolean(latestTodayRecord && latestTodayRecord.clockOutTime);

    res.json({
      clockedIn: Boolean(activeRecord),
      activeRecord,
      todayRecord: activeRecord || latestTodayRecord,
      isCompleted,
      hasClockedInDate: dateRecords.length > 0,
      dateRecords,
    });
  } catch (error) {
    console.error('Error fetching attendance status:', error);
    res.status(500).json({ error: 'Failed to fetch attendance status' });
  }
};

exports.clockIn = async (req, res) => {
  const {
    companyName, department, firstName, lastName, email, employeeId, designation, clockInDate, clockInTime, action
  } = req.body;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const rawCompany = String(companyName || '').trim();
  const effectiveCompany =
    !rawCompany || rawCompany === 'null' || rawCompany === 'undefined'
      ? 'KN Advisors'
      : rawCompany;

  const targetDate = clockInDate || new Date().toISOString().slice(0, 10);
  const targetTime = clockInTime || new Date().toTimeString().split(' ')[0];

  try {
    // Auto-clockout any stale previous-day shifts before clocking in
    await autoClockOutStaleRecords(employeeId);

    // Check if there is already an active clock-in without clock-out
    const existingActive = await Attendance.findOne({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        clockOutTime: null,
      },
      order: [['id', 'DESC']],
    });

    if (existingActive) {
      return res.status(200).json({
        message: 'Already clocked in',
        activeRecord: existingActive,
      });
    }

    // Single-shift: Check if employee already has a shift record for today
    const existingToday = await Attendance.findOne({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        clockInDate: targetDate,
      },
      order: [['id', 'DESC']],
    });

    if (existingToday) {
      if (action === 'resume') {
        // Resume today's single shift: clear clockOutTime so employee continues working
        await existingToday.update({ clockOutTime: null });
        return res.status(200).json({
          message: 'Shift resumed',
          activeRecord: existingToday,
        });
      }
      return res.status(200).json({
        message: 'Shift already completed for today',
        activeRecord: existingToday,
        alreadyCompleted: true,
      });
    }

    // Fetch canonical user profile to guarantee correct department, names, and designation
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { employeeId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    const effectiveDept = (user?.department || department || '').trim();
    const effectiveFirst = user?.firstName || firstName;
    const effectiveLast = user?.lastName || lastName;
    const effectiveDesig = user?.designation || designation;
    const effectiveEmail = user?.email || email;

    const newRecord = await Attendance.create({
      companyName: effectiveCompany,
      department: effectiveDept,
      firstName: effectiveFirst,
      lastName: effectiveLast,
      email: effectiveEmail,
      employeeId,
      designation: effectiveDesig,
      clockInDate: targetDate,
      clockInTime: targetTime,
    });

    res.status(201).json({ message: 'Clock-in recorded', activeRecord: newRecord });
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ error: 'Failed to record clock-in', details: error.message });
  }
};

exports.clockOut = async (req, res) => {
  const { employeeId, companyName, clockOutTime, workedTime } = req.body;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required for clock-out.' });
  }

  const rawCompany = String(companyName || '').trim();
  const effectiveCompany =
    !rawCompany || rawCompany === 'null' || rawCompany === 'undefined'
      ? 'KN Advisors'
      : rawCompany;

  const nowTime = clockOutTime || new Date().toTimeString().split(' ')[0];

  try {
    const activeRecord = await Attendance.findOne({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        clockOutTime: null,
      },
      order: [['id', 'DESC']],
    });

    if (!activeRecord) {
      return res.status(404).json({ error: 'No active clock-in found for this user.' });
    }

    // Calculate worked time accurately
    let finalWorkedTime = workedTime;
    if (!finalWorkedTime && activeRecord.clockInTime) {
      const [ih, im, is] = activeRecord.clockInTime.split(':').map(Number);
      const [oh, om, os] = nowTime.split(':').map(Number);
      const inSec = (ih || 0) * 3600 + (im || 0) * 60 + (is || 0);
      const outSec = (oh || 0) * 3600 + (om || 0) * 60 + (os || 0);
      const diffSec = Math.max(0, outSec - inSec);
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      finalWorkedTime = `${hrs}:${mins}:${secs}`;
    }

    await Attendance.update(
      { clockOutTime: nowTime, workedTime: finalWorkedTime || '00:00:00' },
      { where: { id: activeRecord.id } }
    );

    res.json({
      message: 'Clock-out successfully recorded.',
      workedTime: finalWorkedTime,
      clockOutTime: nowTime,
      clockInTime: activeRecord.clockInTime,
      clockInDate: activeRecord.clockInDate,
    });
  } catch (error) {
    console.error('Database error during clock-out:', error.message);
    res.status(500).json({ error: 'Failed to record clock-out.' });
  }
};

exports.getAllAttendances = async (req, res) => {
  const { companyName, department, role, supervisorDepartment, employeeId, departmentRole } = req.query;

  const rawCompany = String(companyName || '').trim();
  const effectiveCompany =
    !rawCompany || rawCompany === 'null' || rawCompany === 'undefined'
      ? 'KN Advisors'
      : rawCompany;

  try {
    // Auto-clockout any stale previous-day shifts across the organization
    await autoClockOutStaleRecords();

    const where = {};
    if (effectiveCompany) {
      where.companyName = { [Op.iLike]: effectiveCompany };
    }

    const normalizedRole = String(role || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'hr';
    const isDeptSupervisor = !isAdmin && (departmentRole === 'Supervisor' || normalizedRole === 'manager');

    // Role-based visibility:
    if (isAdmin) {
      // Admin: optional department filter
      if (department && department !== 'all') {
        where.department = { [Op.iLike]: department.trim() };
      }
      if (employeeId) {
        where.employeeId = employeeId;
      }
    } else if (isDeptSupervisor) {
      // Department Supervisor / Manager can view their department
      const targetDept = department || supervisorDepartment;
      if (targetDept && targetDept !== 'all') {
        where.department = { [Op.iLike]: targetDept.trim() };
      }
    } else {
      // Regular employee can only view their own attendance records
      if (employeeId) {
        where.employeeId = employeeId;
      }
    }

    const results = await Attendance.findAll({
      where,
      order: [
        ['clockInDate', 'DESC'],
        ['clockInTime', 'DESC'],
      ],
    });
    res.json(results);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getAttendanceStats = async (req, res) => {
  const { companyName, department, role, supervisorDepartment, departmentRole } = req.query;

  const rawCompany = String(companyName || '').trim();
  const effectiveCompany =
    !rawCompany || rawCompany === 'null' || rawCompany === 'undefined'
      ? 'KN Advisors'
      : rawCompany;

  try {
    const where = {
      companyName: { [Op.iLike]: effectiveCompany },
      [Op.and]: literal(`"clock_in_date" >= CURRENT_DATE - INTERVAL '6 days'`),
    };

    const normalizedRole = String(role || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'hr';
    const isDeptSupervisor = !isAdmin && (departmentRole === 'Supervisor' || normalizedRole === 'manager');
    const targetDept = department || (isDeptSupervisor ? supervisorDepartment : null);
    if (targetDept && targetDept !== 'all') {
      where.department = { [Op.iLike]: targetDept.trim() };
    }

    const results = await Attendance.findAll({
      attributes: [
        [literal('"clock_in_date"'), 'date'],
        [fn('SUM', literal(`CASE WHEN "clock_in_time" <= '09:30:00' THEN 1 ELSE 0 END`)), 'onTime'],
        [fn('SUM', literal(`CASE WHEN "clock_in_time" > '09:30:00' THEN 1 ELSE 0 END`)), 'late'],
        [fn('COUNT', literal('*')), 'total'],
      ],
      where,
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