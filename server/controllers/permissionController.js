const { AttendancePermission, User } = require('../models');
const { Op } = require('sequelize');

// Helper to determine start and end dates of a month
const getMonthRange = (monthStr) => {
  // monthStr expected as 'YYYY-MM'
  const now = monthStr ? new Date(`${monthStr}-01T00:00:00`) : new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { startDate, endDate };
};

// 1. Submit a permission request (Late Sign-In or Early Sign-Out)
exports.applyPermission = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      department,
      companyName,
      permissionType,
      date,
      expectedTime,
      durationHours,
      reason,
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    if (!['Late Sign-In', 'Early Sign-Out'].includes(permissionType)) {
      return res.status(400).json({ error: 'Permission type must be "Late Sign-In" or "Early Sign-Out".' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    if (!expectedTime) {
      return res.status(400).json({ error: 'Expected punch time is required.' });
    }

    const duration = parseFloat(durationHours) || 1.0;
    if (duration <= 0 || duration > 2.0) {
      return res.status(400).json({ error: 'Permission duration must be between 0.5 and 2.0 hours.' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a valid reason (at least 10 characters).' });
    }

    const effectiveCompany = companyName || 'KN Advisors';

    // Resolve employee name and department if missing
    let resolvedName = employeeName;
    let resolvedDept = department;
    if (!resolvedName || !resolvedDept) {
      const user = await User.findOne({
        where: {
          employeeId,
          ...(companyName ? { companyName: { [Op.iLike]: effectiveCompany } } : {}),
        },
      });
      if (user) {
        resolvedName = resolvedName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
        resolvedDept = resolvedDept || user.department;
      }
    }

    // Check monthly quota (Max 2 permissions per calendar month)
    const targetMonth = date.slice(0, 7); // 'YYYY-MM'
    const { startDate, endDate } = getMonthRange(targetMonth);

    const monthlyCount = await AttendancePermission.count({
      where: {
        employeeId,
        date: { [Op.between]: [startDate, endDate] },
        status: { [Op.in]: ['Pending', 'Approved'] },
      },
    });

    const MONTHLY_LIMIT = 2;
    if (monthlyCount >= MONTHLY_LIMIT) {
      return res.status(400).json({
        error: `Monthly permission limit of ${MONTHLY_LIMIT} reached for ${targetMonth}. You already have ${monthlyCount} active/approved requests.`,
      });
    }

    // Check for duplicate on the same date and type
    const existing = await AttendancePermission.findOne({
      where: {
        employeeId,
        date,
        permissionType,
        status: { [Op.in]: ['Pending', 'Approved'] },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: `You already have an active ${permissionType} request for ${date} (Status: ${existing.status}).`,
      });
    }

    const permission = await AttendancePermission.create({
      employeeId,
      employeeName: resolvedName || employeeId,
      department: resolvedDept || 'General',
      companyName: effectiveCompany,
      permissionType,
      date,
      expectedTime,
      durationHours: duration,
      reason: reason.trim(),
      status: 'Pending',
    });

    return res.status(201).json({
      message: 'Permission request submitted successfully.',
      permission,
    });
  } catch (error) {
    console.error('Error applying for attendance permission:', error);
    return res.status(500).json({ error: 'Failed to submit permission request.' });
  }
};

// 2. Get logged-in employee's permissions & monthly quota summary
exports.getMyPermissions = async (req, res) => {
  try {
    const { employeeId, month, companyName } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const { startDate, endDate } = getMonthRange(targetMonth);

    const whereClause = {
      employeeId,
    };
    if (companyName && companyName !== 'null' && companyName !== 'undefined') {
      whereClause.companyName = { [Op.iLike]: companyName.trim() };
    }

    // Fetch all records for the employee (newest first)
    const permissions = await AttendancePermission.findAll({
      where: whereClause,
      order: [['date', 'DESC'], ['id', 'DESC']],
    });

    // Calculate quota for current / selected month
    const monthRecords = permissions.filter((p) => {
      const d = p.date ? String(p.date).slice(0, 7) : '';
      return d === targetMonth;
    });

    const approvedCount = monthRecords.filter((p) => p.status === 'Approved').length;
    const pendingCount = monthRecords.filter((p) => p.status === 'Pending').length;
    const MONTHLY_LIMIT = 2;
    const remainingCount = Math.max(0, MONTHLY_LIMIT - (approvedCount + pendingCount));

    return res.json({
      permissions,
      targetMonth,
      quota: {
        monthlyLimit: MONTHLY_LIMIT,
        approvedCount,
        pendingCount,
        usedCount: approvedCount + pendingCount,
        remainingCount,
      },
    });
  } catch (error) {
    console.error('Error fetching employee permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch permissions.' });
  }
};

// 3. Get pending / all permissions for Supervisor or HR / Admin review
exports.getPermissionApprovals = async (req, res) => {
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

    const permissions = await AttendancePermission.findAll({
      where: whereClause,
      order: [
        // Pending first, then by date descending
        [
          AttendancePermission.sequelize.literal(
            "CASE WHEN status = 'Pending' THEN 0 ELSE 1 END"
          ),
          'ASC',
        ],
        ['date', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return res.json({ permissions });
  } catch (error) {
    console.error('Error fetching permission approvals:', error);
    return res.status(500).json({ error: 'Failed to fetch permission approvals.' });
  }
};

// 4. Review a permission request (Approve / Reject)
exports.reviewPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewerId, reviewerName, reviewerRole, reviewerComment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }

    const permission = await AttendancePermission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission request not found.' });
    }

    if (permission.status !== 'Pending') {
      return res.status(400).json({
        error: `This request has already been ${permission.status.toLowerCase()}.`,
      });
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

    await permission.update({
      status: newStatus,
      reviewerId: reviewerId ? String(reviewerId) : (req.user?.id ? String(req.user.id) : null),
      reviewerName: reviewerName || 'Supervisor / HR',
      reviewerRole: reviewerRole || 'Supervisor',
      reviewerComment: reviewerComment ? String(reviewerComment).trim() : null,
      reviewedAt: new Date(),
    });

    return res.json({
      message: `Permission request ${newStatus.toLowerCase()} successfully.`,
      permission,
    });
  } catch (error) {
    console.error('Error reviewing permission request:', error);
    return res.status(500).json({ error: error.message || 'Failed to review permission request.' });
  }
};

// 5. Cancel a pending permission request (by Employee)
exports.cancelPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    const permission = await AttendancePermission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission request not found.' });
    }

    if (employeeId && permission.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this request.' });
    }

    if (permission.status !== 'Pending') {
      return res.status(400).json({
        error: `Cannot cancel request because it is already ${permission.status.toLowerCase()}.`,
      });
    }

    await permission.update({
      status: 'Cancelled',
      cancelledAt: new Date(),
    });

    return res.json({
      message: 'Permission request cancelled successfully.',
      permission,
    });
  } catch (error) {
    console.error('Error cancelling permission request:', error);
    return res.status(500).json({ error: 'Failed to cancel permission request.' });
  }
};

// 6. Check active approved permission for today (used by Clock In / Clock Out header widget)
exports.getActiveTodayPermission = async (req, res) => {
  try {
    const { employeeId, date } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required.' });
    }

    const targetDate = date || new Date().toISOString().slice(0, 10);

    const permissions = await AttendancePermission.findAll({
      where: {
        employeeId,
        date: targetDate,
        status: 'Approved',
      },
      order: [['id', 'DESC']],
    });

    const lateInPermission = permissions.find((p) => p.permissionType === 'Late Sign-In') || null;
    const earlyOutPermission = permissions.find((p) => p.permissionType === 'Early Sign-Out') || null;

    return res.json({
      hasApprovedPermission: permissions.length > 0,
      permissions,
      lateInPermission,
      earlyOutPermission,
    });
  } catch (error) {
    console.error('Error getting active today permission:', error);
    return res.status(500).json({ error: 'Failed to check active permission.' });
  }
};
