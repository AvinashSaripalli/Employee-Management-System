const { Leave, User } = require('../models');
const { Op } = require('sequelize');
const { ensureCompanyMembership, DEFAULT_COMPANY } = require('../utils/companyMembership');
const {
  LEAVE_TYPES,
  HOLIDAYS,
  ACTIVE_STATUSES,
  getLeaveType,
  countWorkingDays,
  formatDate,
  todayDate,
  parseDate,
  addDays,
  sessionsConflict,
  canApproveRole,
} = require('../utils/leavePolicy');

function displayName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

function normalizeStatus(status) {
  if (!status) return '';
  const value = String(status).toLowerCase();
  if (value === 'approved') return 'Approved';
  if (value === 'rejected') return 'Rejected';
  if (value === 'cancelled' || value === 'canceled') return 'Cancelled';
  if (value === 'pending') return 'Pending';
  return status;
}

function firstValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text && text !== 'null' && text !== 'undefined') return text;
  }
  return null;
}

async function resolveIdentity(req) {
  let actor = null;
  if (req.user?.id) {
    actor = await User.findByPk(req.user.id);
  }
  return {
    actor,
    employeeId: firstValue(
      req.query?.employeeId,
      req.body?.employeeId,
      actor?.employeeId,
      req.user?.employeeId
    ),
    companyName: firstValue(
      req.query?.companyName,
      req.body?.companyName,
      actor?.companyName,
      req.user?.companyName
    ),
  };
}

function leaveDays(row) {
  const stored = Number(row.days);
  if (!Number.isNaN(stored) && stored > 0) return stored;
  if (row.half_day) return 0.5;
  return countWorkingDays(row.start_date, row.end_date, false) || 1;
}

async function attachEmployees(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const ids = [...new Set(list.map((row) => row.employeeId).filter(Boolean))];
  const users = ids.length
    ? await User.findAll({
        where: { employeeId: { [Op.in]: ids } },
        attributes: ['firstName', 'lastName', 'department', 'designation', 'photo', 'gender', 'employeeId', 'phoneNumber'],
      })
    : [];
  const byId = {};
  users.forEach((user) => {
    byId[user.employeeId] = user;
  });
  return list.map((row) => {
    const json = typeof row.toJSON === 'function' ? row.toJSON() : { ...row };
    json.employee = byId[json.employeeId] || null;
    if (!json.employee_name && json.employee) json.employee_name = displayName(json.employee);
    json.days = leaveDays(json);
    return json;
  });
}

async function getUsedAndPending(employeeId, companyName, leaveType, year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const where = {
    employeeId,
    leave_type: leaveType,
    status: { [Op.in]: ACTIVE_STATUSES },
    start_date: { [Op.between]: [start, end] },
  };
  if (companyName) where.companyName = companyName;
  const rows = await Leave.findAll({ where });
  return rows.reduce(
    (acc, row) => {
      const days = leaveDays(row);
      if (normalizeStatus(row.status) === 'Approved') acc.used += days;
      if (normalizeStatus(row.status) === 'Pending') acc.pending += days;
      return acc;
    },
    { used: 0, pending: 0 }
  );
}

async function buildBalance(employeeId, companyName, gender) {
  const year = todayDate().getFullYear();
  const types = Object.keys(LEAVE_TYPES).filter((name) => {
    const policy = LEAVE_TYPES[name];
    if (!policy.gender) return true;
    if (!gender) return true;
    return policy.gender.toLowerCase() === String(gender).toLowerCase();
  });

  const breakdown = [];
  for (const name of types) {
    const policy = LEAVE_TYPES[name];
    const { used, pending } = await getUsedAndPending(employeeId, companyName, name, year);
    const allocated = policy.allocated;
    const available = allocated == null ? null : Math.max(0, Number((allocated - used - pending).toFixed(1)));
    breakdown.push({
      leaveType: name,
      code: policy.code,
      allocated,
      used: Number(used.toFixed(1)),
      pending: Number(pending.toFixed(1)),
      available,
      paid: policy.paid,
    });
  }

  const paid = breakdown.filter((row) => row.paid && row.allocated != null);
  const allocated = paid.reduce((sum, row) => sum + (row.allocated || 0), 0);
  const used = paid.reduce((sum, row) => sum + row.used, 0);
  const pending = paid.reduce((sum, row) => sum + row.pending, 0);
  const extra = paid.reduce((sum, row) => sum + Math.max(0, row.used - (row.allocated || 0)), 0);

  return {
    year,
    allocated,
    used: Number(used.toFixed(1)),
    pending: Number(pending.toFixed(1)),
    available: Number(Math.max(0, allocated - used - pending).toFixed(1)),
    extra: Number(extra.toFixed(1)),
    holidays: HOLIDAYS.filter((h) => h.date.startsWith(String(year))).length,
    breakdown,
  };
}

async function findOverlaps({ employeeId, companyName, startDate, endDate, halfDay, halfDaySession, excludeId }) {
  const where = {
    employeeId,
    companyName,
    status: { [Op.in]: ACTIVE_STATUSES },
    start_date: { [Op.lte]: endDate },
    end_date: { [Op.gte]: startDate },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const existing = await Leave.findAll({ where });
  return existing.filter((row) =>
    sessionsConflict(
      {
        start_date: startDate,
        end_date: endDate,
        half_day: halfDay,
        half_day_session: halfDaySession,
      },
      row
    )
  );
}

exports.getPolicies = async (_req, res) => {
  res.json({
    types: LEAVE_TYPES,
    holidays: HOLIDAYS,
  });
};

exports.leaveApply = async (req, res) => {
  const {
    leaveType,
    startDate,
    endDate,
    reason,
    onlyTomorrow,
    halfDay,
    halfDaySession,
    contactPhone,
  } = req.body;

  try {
    let { actor, employeeId, companyName } = await resolveIdentity(req);
    if (actor) {
      await ensureCompanyMembership(actor, DEFAULT_COMPANY);
      employeeId = actor.employeeId || employeeId;
      companyName = actor.companyName || companyName;
    }
    if (!actor && !employeeId) {
      return res.status(401).json({ error: 'Unable to identify the signed-in employee' });
    }

    if (!employeeId || !companyName) {
      return res.status(400).json({ error: 'Employee is not assigned to a company yet' });
    }

    const policy = getLeaveType(leaveType);
    if (!policy) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    const profile = actor || (await User.findOne({ where: { employeeId, companyName } }));
    if (policy.gender && profile?.gender && policy.gender.toLowerCase() !== String(profile.gender).toLowerCase()) {
      return res.status(400).json({ error: `${leaveType} is not available for this profile` });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }
    if (parseDate(startDate) > parseDate(endDate)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }
    if (!reason || String(reason).trim().length < 10) {
      return res.status(400).json({ error: 'Reason must be at least 10 characters' });
    }

    if (halfDay && startDate !== endDate) {
      return res.status(400).json({ error: 'Half-day leave must be for a single date' });
    }

    const today = todayDate();
    const start = parseDate(startDate);
    if (policy.allowPast) {
      const oldest = addDays(today, -(policy.maxPastDays || 7));
      if (start < oldest) {
        return res.status(400).json({ error: `${leaveType} can only be applied up to ${policy.maxPastDays || 7} days in the past` });
      }
    } else if (start < today) {
      return res.status(400).json({ error: 'Past dates are not allowed for this leave type' });
    }

    if (policy.minNoticeDays) {
      const minStart = addDays(today, policy.minNoticeDays);
      if (start < minStart && start >= today) {
        return res.status(400).json({
          error: `${leaveType} requires at least ${policy.minNoticeDays} day(s) of notice`,
        });
      }
    }

    const days = countWorkingDays(startDate, endDate, !!halfDay);
    if (days <= 0) {
      return res.status(400).json({ error: 'Selected range has no working days. Weekends and holidays are excluded.' });
    }

    const overlaps = await findOverlaps({
      employeeId,
      companyName,
      startDate,
      endDate,
      halfDay: !!halfDay,
      halfDaySession: halfDay ? (halfDaySession || 'AM') : null,
    });
    if (overlaps.length) {
      return res.status(409).json({
        error: 'This request overlaps an existing pending or approved leave',
        overlaps: overlaps.map((row) => ({
          id: row.id,
          leave_type: row.leave_type,
          start_date: row.start_date,
          end_date: row.end_date,
          status: row.status,
        })),
      });
    }

    const year = start.getFullYear();
    if (policy.allocated != null) {
      const { used, pending } = await getUsedAndPending(employeeId, companyName, leaveType, year);
      const remaining = policy.allocated - used - pending;
      if (days > remaining) {
        return res.status(400).json({
          error: `Insufficient ${leaveType} balance. Available: ${Number(remaining.toFixed(1))} day(s), requested: ${days}`,
        });
      }
    }

    const leave = await Leave.create({
      employeeId,
      employee_name: displayName(profile || actor),
      department: profile?.department || actor?.department,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days,
      reason: String(reason).trim(),
      only_tomorrow: !!onlyTomorrow,
      half_day: !!halfDay,
      half_day_session: halfDay ? (halfDaySession || 'AM') : null,
      contact_phone: contactPhone || profile?.phoneNumber || actor?.phoneNumber || null,
      status: 'Pending',
      companyName,
    });

    res.status(201).json({
      message: 'Leave request submitted for approval',
      leave,
    });
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const identity = await resolveIdentity(req);
    if (identity.actor) {
      await ensureCompanyMembership(identity.actor, DEFAULT_COMPANY);
    }
    const employeeId = identity.actor?.employeeId || identity.employeeId;
    const companyName = identity.actor?.companyName || identity.companyName;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID and company are required' });
    }

    const target = identity.actor && employeeId === identity.actor.employeeId
      ? identity.actor
      : await User.findOne({ where: companyName ? { employeeId, companyName } : { employeeId } });

    const balance = await buildBalance(employeeId, companyName, target?.gender);
    res.json(balance);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  const { actor, companyName } = await resolveIdentity(req);
  const { status, leaveType, search, from, to } = req.query;
  const role = actor?.role || req.user?.role;
  const department = actor?.department || req.user?.department;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  if (!canApproveRole(role, department)) {
    return res.status(403).json({ error: 'Not allowed to view team leave requests' });
  }

  try {
    const where = { companyName };
    if (status && status !== 'All') {
      where.status = { [Op.iLike]: normalizeStatus(status) };
    }
    if (leaveType && leaveType !== 'All') where.leave_type = leaveType;
    if (from && to) {
      where.start_date = { [Op.lte]: to };
      where.end_date = { [Op.gte]: from };
    }

    const results = await attachEmployees(await Leave.findAll({
      where,
      order: [['created_at', 'DESC']],
    }));

    const needle = (search || '').trim().toLowerCase();
    const filtered = needle
      ? results.filter((row) => {
          const name = row.employee_name || displayName(row.employee);
          return (
            String(row.employeeId || '').toLowerCase().includes(needle) ||
            String(name || '').toLowerCase().includes(needle) ||
            String(row.department || row.employee?.department || '').toLowerCase().includes(needle) ||
            String(row.reason || '').toLowerCase().includes(needle)
          );
        })
      : results;

    filtered.sort((a, b) => {
      const rank = (statusValue) => (normalizeStatus(statusValue) === 'Pending' ? 0 : normalizeStatus(statusValue) === 'Approved' ? 1 : 2);
      return rank(a.status) - rank(b.status);
    });

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching leave records:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.getCalendar = async (req, res) => {
  const { companyName } = await resolveIdentity(req);
  const from = req.query.from || formatDate(new Date(todayDate().getFullYear(), todayDate().getMonth(), 1));
  const to = req.query.to || formatDate(new Date(todayDate().getFullYear(), todayDate().getMonth() + 1, 0));

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await attachEmployees(await Leave.findAll({
      where: {
        companyName,
        status: { [Op.iLike]: 'Approved' },
        start_date: { [Op.lte]: to },
        end_date: { [Op.gte]: from },
      },
      order: [['start_date', 'ASC']],
    }));
    res.json(results);
  } catch (error) {
    console.error('Error fetching leave calendar:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.getRecentLeaves = async (req, res) => {
  try {
    const identity = await resolveIdentity(req);
    if (identity.actor) {
      await ensureCompanyMembership(identity.actor, DEFAULT_COMPANY);
    }
    const employeeId = identity.actor?.employeeId || identity.employeeId;
    const companyName = identity.actor?.companyName || identity.companyName;

    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID and Company Name are required' });
    }

    const where = { employeeId };
    if (companyName) where.companyName = companyName;
    const results = await Leave.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 6,
    });
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching recent leaves:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};

exports.getLeaveCounts = async (req, res) => {
  const { companyName } = await resolveIdentity(req);

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const rows = await Leave.findAll({ where: { companyName } });
    const counts = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        const status = normalizeStatus(row.status);
        if (status === 'Approved') acc.approved += 1;
        else if (status === 'Pending') acc.pending += 1;
        else if (status === 'Rejected') acc.rejected += 1;
        else if (status === 'Cancelled') acc.cancelled += 1;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0 }
    );

    const today = formatDate(todayDate());
    counts.onLeaveToday = rows.filter(
      (row) =>
        normalizeStatus(row.status) === 'Approved' &&
        String(row.start_date).slice(0, 10) <= today &&
        String(row.end_date).slice(0, 10) >= today
    ).length;

    res.json(counts);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { leaveId, status, comment } = req.body;
  const nextStatus = normalizeStatus(status);

  if (!leaveId || !nextStatus) {
    return res.status(400).json({ error: 'Leave ID and status are required' });
  }
  if (!['Approved', 'Rejected'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }
  if (nextStatus === 'Rejected' && (!comment || String(comment).trim().length < 4)) {
    return res.status(400).json({ error: 'A short rejection reason is required' });
  }

  try {
    const { actor, employeeId, companyName } = await resolveIdentity(req);
    const role = actor?.role || req.user?.role;
    const department = actor?.department || req.user?.department;
    if (!canApproveRole(role, department)) {
      return res.status(403).json({ error: 'Only managers or HR can review leave requests' });
    }

    const leave = await Leave.findByPk(leaveId);
    if (!leave) {
      return res.status(404).json({ error: 'Leave record not found' });
    }
    if (leave.companyName && companyName && leave.companyName !== companyName) {
      return res.status(403).json({ error: 'Leave belongs to another company' });
    }
    if (normalizeStatus(leave.status) !== 'Pending') {
      return res.status(400).json({ error: `This request is already ${leave.status}` });
    }
    if (employeeId && leave.employeeId === employeeId) {
      return res.status(400).json({ error: 'You cannot approve or reject your own leave request' });
    }

    await leave.update({
      status: nextStatus,
      reviewer_id: actor?.id || req.user?.id || null,
      reviewer_name: displayName(actor) || req.user?.role || 'Reviewer',
      review_comment: comment ? String(comment).trim() : null,
      reviewed_at: new Date(),
    });

    res.json({ message: `Leave ${nextStatus.toLowerCase()} successfully`, leave });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.cancelLeave = async (req, res) => {
  const leaveId = req.params.id || req.body.leaveId;
  const { comment } = req.body || {};

  try {
    const { actor, employeeId } = await resolveIdentity(req);
    if (!actor && !employeeId) return res.status(401).json({ error: 'Unauthorized' });

    const leave = await Leave.findByPk(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave record not found' });

    const role = actor?.role || req.user?.role;
    const department = actor?.department || req.user?.department;
    const isOwner = employeeId && leave.employeeId === employeeId;
    const isApprover = canApproveRole(role, department);
    if (!isOwner && !isApprover) {
      return res.status(403).json({ error: 'You can only cancel your own leave requests' });
    }
    if (!['Pending', 'Approved'].includes(normalizeStatus(leave.status))) {
      return res.status(400).json({ error: `Cannot cancel a ${leave.status} request` });
    }

    const today = formatDate(todayDate());
    if (normalizeStatus(leave.status) === 'Approved' && String(leave.start_date).slice(0, 10) <= today) {
      return res.status(400).json({ error: 'Approved leave that has already started cannot be cancelled' });
    }

    await leave.update({
      status: 'Cancelled',
      cancelled_at: new Date(),
      review_comment: comment ? String(comment).trim() : leave.review_comment,
      reviewer_id: isOwner ? leave.reviewer_id : (actor?.id || req.user?.id || leave.reviewer_id),
      reviewer_name: isOwner ? leave.reviewer_name : (displayName(actor) || leave.reviewer_name),
    });

    res.json({ message: 'Leave cancelled successfully', leave });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

exports.getLeavesByEmployee = async (req, res) => {
  try {
    const identity = await resolveIdentity(req);
    if (identity.actor) {
      await ensureCompanyMembership(identity.actor, DEFAULT_COMPANY);
    }
    const employeeId = identity.actor?.employeeId || identity.employeeId;
    const companyName = identity.actor?.companyName || identity.companyName;

    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const where = { employeeId };
    if (companyName) where.companyName = companyName;
    const results = await Leave.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
};

exports.getApprovedLeavesToday = async (req, res) => {
  const { companyName } = await resolveIdentity(req);

  if (!companyName) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const today = formatDate(todayDate());

  try {
    const rows = await attachEmployees(await Leave.findAll({
      where: {
        companyName,
        status: { [Op.iLike]: 'Approved' },
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
      },
    }));
    res.json({
      leaveCount: rows.length,
      employees: rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        name: row.employee_name || displayName(row.employee),
        leave_type: row.leave_type,
        half_day: row.half_day,
        half_day_session: row.half_day_session,
      })),
    });
  } catch (error) {
    console.error('Error fetching approved leaves:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

