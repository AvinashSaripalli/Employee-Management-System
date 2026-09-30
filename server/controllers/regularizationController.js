const { AttendanceRegularization, Attendance, User, Department } = require('../models');
const { Op } = require('sequelize');
const { dispatchNotification, notifyAdminsAndSupervisors } = require('../utils/notificationDispatcher');
const { logAuditEvent } = require('../utils/auditLogger');

// Helper to compute worked time string "HH:MM:SS" from two time strings
function computeWorkedTime(inTime, outTime) {
  if (!inTime || !outTime) return '00:00:00';

  const parseTime = (t) => {
    const parts = String(t).trim().split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    const s = parseInt(parts[2] || '0', 10);
    return h * 3600 + m * 60 + s;
  };

  const inSec = parseTime(inTime);
  const outSec = parseTime(outTime);
  // Support cross-midnight / night-shift duration (e.g., 22:00 to 06:00)
  let diffSec = outSec - inSec;
  if (diffSec < 0) {
    diffSec += 86400; // rollover 24 hours
  }

  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

// 1. Submit an Attendance Regularization Request
exports.applyRegularization = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      department,
      companyName,
      date,
      regularizationType,
      requestedClockInTime,
      requestedClockOutTime,
      reason,
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date to regularize is required.' });
    }

    // Date cannot be in the future
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date > todayStr) {
      return res.status(400).json({ error: 'You cannot regularize attendance for a future date.' });
    }

    if (!requestedClockInTime || !requestedClockOutTime) {
      return res.status(400).json({ error: 'Both requested Clock-In and Clock-Out times are required.' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a clear justification / reason (at least 10 characters).' });
    }

    const effectiveCompany = companyName || 'KN Advisors';

    // Resolve employee details if not provided
    let resolvedName = employeeName;
    let resolvedDept = department;
    let userObj = null;

    if (!resolvedName || !resolvedDept) {
      userObj = await User.findOne({
        where: {
          employeeId,
          ...(companyName ? { companyName: { [Op.iLike]: effectiveCompany } } : {}),
        },
      });
      if (userObj) {
        resolvedName = resolvedName || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
        resolvedDept = resolvedDept || userObj.department;
      }
    }

    // Check for existing pending or approved regularization on the same date
    const existing = await AttendanceRegularization.findOne({
      where: {
        employeeId,
        date,
        status: { [Op.in]: ['Pending', 'Approved'] },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: `A regularization request for ${date} is already ${existing.status.toLowerCase()}.`,
      });
    }

    const regularization = await AttendanceRegularization.create({
      employeeId,
      employeeName: resolvedName || 'Employee',
      department: resolvedDept || 'General',
      companyName: effectiveCompany,
      date,
      regularizationType: regularizationType || 'Missed Punch',
      requestedClockInTime: requestedClockInTime.length === 5 ? `${requestedClockInTime}:00` : requestedClockInTime,
      requestedClockOutTime: requestedClockOutTime.length === 5 ? `${requestedClockOutTime}:00` : requestedClockOutTime,
      reason: reason.trim(),
      status: 'Pending',
    });

    // Notify Department Supervisors and Admins
    notifyAdminsAndSupervisors(req.app, {
      department: regularization.department,
      companyName: effectiveCompany,
      excludeEmployeeId: employeeId,
      senderId: employeeId,
      senderName: regularization.employeeName,
      category: 'attendance',
      type: 'regularization_requested',
      title: `Attendance Regularization: ${regularization.employeeName}`,
      message: `${regularization.employeeName} requested attendance regularization for ${regularization.date} (${regularization.requestedClockInTime} - ${regularization.requestedClockOutTime}). Reason: ${regularization.reason}`,
      severity: 'action',
      target: 'Time & Attendance',
      targetId: regularization.id,
      actionLabel: 'Review Request',
    });

    return res.status(201).json({
      message: 'Attendance regularization request submitted successfully.',
      regularization,
    });
  } catch (error) {
    console.error('Error applying for attendance regularization:', error);
    return res.status(500).json({ error: 'Failed to submit regularization request.' });
  }
};

// 2. Get logged-in employee's regularization history
exports.getMyRegularizations = async (req, res) => {
  try {
    const { employeeId, month, companyName } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    const whereClause = { employeeId };
    if (companyName && companyName !== 'null' && companyName !== 'undefined') {
      whereClause.companyName = { [Op.iLike]: companyName.trim() };
    }

    if (month) {
      // YYYY-MM
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;
      whereClause.date = { [Op.between]: [startDate, endDate] };
    }

    const regularizations = await AttendanceRegularization.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['id', 'DESC']],
    });

    return res.json({ regularizations });
  } catch (error) {
    console.error('Error fetching employee regularizations:', error);
    return res.status(500).json({ error: 'Failed to fetch regularizations.' });
  }
};

// 3. Get pending / all regularizations for Reviewers (Supervisor / HR / Admin)
exports.getRegularizationApprovals = async (req, res) => {
  try {
    const { department, status, companyName } = req.query;
    const whereClause = {};

    if (companyName && companyName !== 'null' && companyName !== 'undefined') {
      whereClause.companyName = { [Op.iLike]: companyName.trim() };
    }

    if (department && department !== 'all') {
      whereClause.department = { [Op.iLike]: department.trim() };
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const regularizations = await AttendanceRegularization.findAll({
      where: whereClause,
      order: [
        [
          AttendanceRegularization.sequelize.literal(
            "CASE WHEN status = 'Pending' THEN 0 ELSE 1 END"
          ),
          'ASC',
        ],
        ['date', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return res.json({ regularizations });
  } catch (error) {
    console.error('Error fetching regularization approvals:', error);
    return res.status(500).json({ error: 'Failed to fetch regularization approvals.' });
  }
};

// 4. Review a regularization request (Approve / Reject)
exports.reviewRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewerId, reviewerName, reviewerRole, reviewerComment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }

    const regularization = await AttendanceRegularization.findByPk(id);
    if (!regularization) {
      return res.status(404).json({ error: 'Regularization request not found.' });
    }

    if (regularization.status !== 'Pending') {
      return res.status(400).json({
        error: `This request has already been ${regularization.status.toLowerCase()}.`,
      });
    }

    // Authorization check
    const actorRole = String(req.user?.role || reviewerRole || '').toLowerCase();
    const actorId = req.user?.id ? Number(req.user.id) : (reviewerId ? Number(reviewerId) : null);
    const isPrivileged = actorRole === 'admin' || actorRole === 'hr';

    let isDelegatedReview = false;
    if (!isPrivileged && actorId) {
      const dept = await Department.findOne({
        where: { name: regularization.department, companyName: regularization.companyName },
      });
      const isDeptSupervisor = dept && Number(dept.supervisorId) === actorId;
      const isDeptDelegated = dept && Number(dept.delegatedSupervisorId) === actorId;

      let isSupervisorDelegate = false;
      if (dept?.supervisorId) {
        const sup = await User.findByPk(dept.supervisorId);
        if (sup && Number(sup.delegatedToId) === actorId) isSupervisorDelegate = true;
      }

      if (isDeptDelegated || isSupervisorDelegate) {
        isDelegatedReview = true;
      } else if (!isDeptSupervisor) {
        return res.status(403).json({ error: 'You are not authorized to review regularizations for this department.' });
      }
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const now = new Date();

    await regularization.update({
      status: newStatus,
      reviewerId: reviewerId ? String(reviewerId) : (req.user?.id ? String(req.user.id) : null),
      reviewerName: reviewerName || 'Supervisor / HR',
      reviewerRole: reviewerRole || 'Supervisor',
      reviewerComment: reviewerComment ? String(reviewerComment).trim() : null,
      reviewedAt: now,
    });

    // If Approved, automatically update or create the Attendance record!
    let workedTime = '00:00:00';
    if (newStatus === 'Approved') {
      workedTime = computeWorkedTime(
        regularization.requestedClockInTime,
        regularization.requestedClockOutTime
      );

      // Check if attendance record already exists for that date and employee
      const existingAttendance = await Attendance.findOne({
        where: {
          employeeId: regularization.employeeId,
          clockInDate: regularization.date,
        },
      });

      if (existingAttendance) {
        await existingAttendance.update({
          clockInTime: regularization.requestedClockInTime,
          clockOutTime: regularization.requestedClockOutTime,
          workedTime,
        });
      } else {
        // Query user details to ensure clean record
        const user = await User.findOne({
          where: { employeeId: regularization.employeeId },
        });

        await Attendance.create({
          employeeId: regularization.employeeId,
          firstName: user?.firstName || regularization.employeeName.split(' ')[0] || 'Employee',
          lastName: user?.lastName || regularization.employeeName.split(' ').slice(1).join(' ') || '',
          email: user?.email || '',
          department: regularization.department,
          companyName: regularization.companyName,
          designation: user?.designation || 'Staff',
          clockInDate: regularization.date,
          clockInTime: regularization.requestedClockInTime,
          clockOutTime: regularization.requestedClockOutTime,
          workedTime,
        });
      }
    }

    // Audit Logging
    await logAuditEvent({
      req,
      action: newStatus === 'Approved' ? 'ATTENDANCE_REGULARIZED' : 'REGULARIZATION_REJECTED',
      targetType: 'AttendanceRegularization',
      targetId: String(regularization.id),
      targetEmployeeId: regularization.employeeId,
      targetName: regularization.employeeName,
      details: `${newStatus} attendance regularization for ${regularization.employeeName} (${regularization.employeeId}) on ${regularization.date} [In: ${regularization.requestedClockInTime}, Out: ${regularization.requestedClockOutTime}${newStatus === 'Approved' ? `, Worked: ${workedTime}` : ''}]${isDelegatedReview ? ` [Reviewed by acting/delegated supervisor: ${reviewerName}]` : ''}${reviewerComment ? '. Comment: ' + reviewerComment : ''}`,
    });

    // Notification to Employee
    dispatchNotification(req.app, {
      recipientId: regularization.employeeId,
      senderId: reviewerId ? String(reviewerId) : null,
      senderName: reviewerName || 'Supervisor / HR',
      companyName: regularization.companyName,
      category: 'attendance',
      type: 'regularization_reviewed',
      title: `Attendance Regularization ${newStatus}`,
      message: `Your attendance regularization for ${regularization.date} was ${newStatus.toLowerCase()}${newStatus === 'Approved' ? ` (${regularization.requestedClockInTime} - ${regularization.requestedClockOutTime}, ${workedTime} worked)` : ''}${reviewerComment ? ': "' + reviewerComment.trim() + '"' : '.'}`,
      severity: newStatus === 'Approved' ? 'success' : 'urgent',
      target: 'Time & Attendance',
      targetId: regularization.id,
      actionLabel: 'View Attendance',
    });

    return res.json({
      message: `Regularization request ${newStatus.toLowerCase()} successfully.`,
      regularization,
      workedTime: newStatus === 'Approved' ? workedTime : null,
    });
  } catch (error) {
    console.error('Error reviewing regularization:', error);
    return res.status(500).json({ error: 'Failed to process regularization review.' });
  }
};

// 5. Cancel a pending regularization request
exports.cancelRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const regularization = await AttendanceRegularization.findByPk(id);

    if (!regularization) {
      return res.status(404).json({ error: 'Regularization request not found.' });
    }

    if (regularization.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot cancel a request that is already ${regularization.status.toLowerCase()}.` });
    }

    await regularization.update({ status: 'Cancelled' });

    return res.json({
      message: 'Regularization request cancelled.',
      regularization,
    });
  } catch (error) {
    console.error('Error cancelling regularization:', error);
    return res.status(500).json({ error: 'Failed to cancel regularization.' });
  }
};

// 6. Check existing attendance status for a given date
exports.checkDateAttendance = async (req, res) => {
  try {
    const { employeeId, date } = req.query;
    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required.' });
    }

    const attendance = await Attendance.findOne({
      where: { employeeId, clockInDate: date },
    });

    const activeRegularization = await AttendanceRegularization.findOne({
      where: {
        employeeId,
        date,
        status: { [Op.in]: ['Pending', 'Approved'] },
      },
    });

    return res.json({
      hasRecord: Boolean(attendance),
      attendance: attendance || null,
      activeRegularization: activeRegularization || null,
    });
  } catch (error) {
    console.error('Error checking date attendance:', error);
    return res.status(500).json({ error: 'Failed to inspect date attendance.' });
  }
};
