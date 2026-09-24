const { Task, Leave, Report, Attendance, Message, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Advanced Notification Controller
 * Aggregates live presence, overdue work reports, tasks, leave approvals, and messages.
 */
exports.getNotifications = async (req, res) => {
  const { employeeId, companyName, role, department, departmentRole } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const rawCompany = String(companyName || '').trim();
  const effectiveCompany =
    !rawCompany || rawCompany === 'null' || rawCompany === 'undefined'
      ? 'KN Advisors'
      : rawCompany;

  const normalizedRole = String(role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'hr';
  const isSupervisor = !isAdmin && (departmentRole === 'Supervisor' || normalizedRole === 'manager');

  const notifications = [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  try {
    // -------------------------------------------------------------
    // 1. ATTENDANCE & SHIFT NOTIFICATIONS
    // -------------------------------------------------------------
    // A. Check for currently active shift today
    const activeShift = await Attendance.findOne({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        clockOutTime: null,
      },
      order: [['id', 'DESC']],
    });

    if (activeShift) {
      notifications.push({
        id: `shift-active-${activeShift.id}`,
        category: 'shift',
        badge: 'In Progress',
        severity: 'info',
        actorName: 'Time & Attendance',
        subtitle: `Shift clocked in at ${activeShift.clockInTime ? activeShift.clockInTime.slice(0, 5) : 'today'}`,
        title: 'Active Shift in Progress',
        detail: `You are currently clocked in. Remember to finish your tasks and file your daily work report.`,
        createdAt: activeShift.clockInDate ? new Date(`${activeShift.clockInDate}T${activeShift.clockInTime || '09:00:00'}`) : now,
        target: 'Time & Attendance',
        actionLabel: 'View Shift',
      });
    }

    // B. Check for unsubmitted work reports (overdue from yesterday or due today)
    const attendances = await Attendance.findAll({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
      },
      order: [['clockInDate', 'ASC']],
    });

    const userReports = await Report.findAll({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
      },
      attributes: ['date'],
    });

    const submittedDates = new Set(
      userReports.map((r) => (r.date ? String(r.date).slice(0, 10) : '')).filter(Boolean)
    );

    // Group attendances by date
    const attByDate = new Map();
    for (const a of attendances) {
      const d = a.clockInDate ? String(a.clockInDate).slice(0, 10) : null;
      if (d && !attByDate.has(d)) attByDate.set(d, a);
    }

    for (const [dateStr, att] of attByDate.entries()) {
      if (!submittedDates.has(dateStr)) {
        const isPast = dateStr < todayStr;
        if (isPast) {
          notifications.push({
            id: `report-overdue-${dateStr}`,
            category: 'report',
            badge: 'Overdue',
            severity: 'urgent',
            actorName: 'Work Reports',
            subtitle: `Overdue from ${dateStr}`,
            title: `Unsubmitted Work Report (${dateStr})`,
            detail: `You have not submitted your work report for ${dateStr}. Prior reports must be filed first to finalize attendance records.`,
            createdAt: new Date(`${dateStr}T23:59:00`),
            target: 'Work Reports',
            actionLabel: 'Submit Report',
          });
        } else if (dateStr === todayStr && att.clockOutTime) {
          notifications.push({
            id: `report-due-today-${dateStr}`,
            category: 'report',
            badge: 'Due Today',
            severity: 'action',
            actorName: 'Work Reports',
            subtitle: `Shift ended at ${att.clockOutTime.slice(0, 5)}`,
            title: `Daily Work Report Due`,
            detail: `You concluded your shift today at ${att.clockOutTime.slice(0, 5)}. Please file your daily work report.`,
            createdAt: new Date(),
            target: 'Work Reports',
            actionLabel: 'Submit Report',
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 2. TASK & PROJECT NOTIFICATIONS
    // -------------------------------------------------------------
    const activeTasks = await Task.findAll({
      where: {
        companyName: { [Op.iLike]: effectiveCompany },
        status: { [Op.notIn]: [5, 7] }, // Not completed (5) or closed (7)
        [Op.or]: [
          { responsibleId: employeeId },
          { createdBy: employeeId },
        ],
      },
      order: [['deadline', 'ASC'], ['id', 'DESC']],
      limit: 10,
    });

    for (const task of activeTasks) {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = deadline && deadline < now;
      const isDueSoon = deadline && !isOverdue && (deadline.getTime() - now.getTime()) <= 48 * 3600 * 1000;

      if (isOverdue) {
        notifications.push({
          id: `task-overdue-${task.id}`,
          category: 'task',
          badge: 'Overdue',
          severity: 'urgent',
          actorName: 'Tasks & Projects',
          subtitle: `Deadline passed on ${task.deadline.toISOString().slice(0, 10)}`,
          title: `Task Overdue: ${task.title}`,
          detail: task.description ? (task.description.length > 90 ? `${task.description.slice(0, 90)}...` : task.description) : 'Task deadline has passed. Please update status.',
          createdAt: deadline,
          target: isAdmin ? 'Tasks and Projects' : 'Tasks',
          actionLabel: 'Open Task',
        });
      } else if (isDueSoon) {
        notifications.push({
          id: `task-due-${task.id}`,
          category: 'task',
          badge: 'Due Soon',
          severity: 'action',
          actorName: 'Tasks & Projects',
          subtitle: `Due on ${task.deadline.toISOString().slice(0, 10)}`,
          title: `Task Due Soon: ${task.title}`,
          detail: task.description ? (task.description.length > 90 ? `${task.description.slice(0, 90)}...` : task.description) : 'Approaching deadline within 48 hours.',
          createdAt: task.updatedAt || now,
          target: isAdmin ? 'Tasks and Projects' : 'Tasks',
          actionLabel: 'Open Task',
        });
      } else if (task.responsibleId === employeeId) {
        notifications.push({
          id: `task-assigned-${task.id}`,
          category: 'task',
          badge: 'Assigned',
          severity: 'info',
          actorName: 'Tasks & Projects',
          subtitle: 'Assigned Task',
          title: task.title,
          detail: task.description ? (task.description.length > 90 ? `${task.description.slice(0, 90)}...` : task.description) : 'Active task in progress.',
          createdAt: task.createdAt,
          target: isAdmin ? 'Tasks and Projects' : 'Tasks',
          actionLabel: 'View Task',
        });
      }
    }

    // -------------------------------------------------------------
    // 3. LEAVE NOTIFICATIONS
    // -------------------------------------------------------------
    // A. For Admin or Supervisor: Pending leaves needing approval
    if (isAdmin || isSupervisor) {
      const pendingLeaveWhere = {
        companyName: { [Op.iLike]: effectiveCompany },
        status: 'Pending',
      };
      if (isSupervisor && department && department !== 'all') {
        pendingLeaveWhere.department = { [Op.iLike]: department.trim() };
      }

      const pendingLeaves = await Leave.findAll({
        where: pendingLeaveWhere,
        order: [['id', 'DESC']],
        limit: 8,
      });

      for (const leave of pendingLeaves) {
        notifications.push({
          id: `leave-review-${leave.id}`,
          category: 'leave',
          badge: 'Pending Review',
          severity: 'action',
          actorName: leave.employee_name || 'Team Member',
          subtitle: `${leave.department || 'Department'} · ${leave.leave_type || 'Leave'} (${leave.days || 1} day)`,
          title: `Leave Request from ${leave.employee_name || 'Employee'}`,
          detail: `${leave.leave_type} requested from ${leave.start_date} to ${leave.end_date}.`,
          createdAt: leave.createdAt,
          target: 'Manage Leaves',
          actionLabel: 'Review Request',
        });
      }
    }

    // B. For Employee: Decision on personal leave requests (Approved or Rejected)
    const personalLeaves = await Leave.findAll({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        status: { [Op.in]: ['Approved', 'Rejected'] },
      },
      order: [['id', 'DESC']],
      limit: 5,
    });

    for (const leave of personalLeaves) {
      const isApproved = leave.status === 'Approved';
      notifications.push({
        id: `leave-decision-${leave.id}`,
        category: 'leave',
        badge: leave.status,
        severity: isApproved ? 'success' : 'urgent',
        actorName: 'Leave Management',
        subtitle: `${leave.leave_type} (${leave.start_date})`,
        title: `Leave Request ${leave.status}`,
        detail: `Your ${leave.leave_type} request for ${leave.start_date} was ${leave.status.toLowerCase()}.`,
        createdAt: leave.reviewed_at || leave.final_approved_at || leave.created_at || now,
        target: 'My Leaves',
        actionLabel: 'View Status',
      });
    }

    // -------------------------------------------------------------
    // 4. WORK REPORT REVIEWS (for Supervisors/Admin)
    // -------------------------------------------------------------
    if (isAdmin || isSupervisor) {
      const recentReportsWhere = {
        companyName: { [Op.iLike]: effectiveCompany },
      };
      if (isSupervisor && department && department !== 'all') {
        recentReportsWhere.department = { [Op.iLike]: department.trim() };
      }

      const recentReports = await Report.findAll({
        where: recentReportsWhere,
        order: [['id', 'DESC']],
        limit: 5,
      });

      for (const rep of recentReports) {
        if (rep.employeeId !== employeeId) {
          notifications.push({
            id: `report-submitted-${rep.id}`,
            category: 'report',
            badge: 'Submitted',
            severity: 'info',
            actorName: rep.employeeName || 'Team Member',
            subtitle: `${rep.department || 'Department'} · ${rep.hoursWorked}h logged`,
            title: `Work Report: ${rep.employeeName}`,
            detail: `${rep.taskName || 'Daily tasks'} (${rep.hoursWorked}h) on ${rep.date}.`,
            createdAt: rep.createdAt,
            target: 'Work Reports',
            actionLabel: 'Review Report',
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 5. MESSENGER NOTIFICATIONS
    // -------------------------------------------------------------
    const recentMessages = await Message.findAll({
      where: {
        companyName: { [Op.iLike]: effectiveCompany },
        senderEmployeeId: { [Op.ne]: employeeId },
      },
      order: [['id', 'DESC']],
      limit: 4,
    });

    for (const msg of recentMessages) {
      notifications.push({
        id: `msg-${msg.id}`,
        category: 'message',
        badge: 'Message',
        severity: 'info',
        actorName: msg.senderName || 'Colleague',
        subtitle: 'Direct Message',
        title: `Message from ${msg.senderName}`,
        detail: msg.content ? (msg.content.length > 80 ? `${msg.content.slice(0, 80)}...` : msg.content) : 'Sent an attachment',
        createdAt: msg.createdAt,
        target: 'Messenger',
        actionLabel: 'Open Chat',
      });
    }

    // Sort: Urgent (4) -> Action (3) -> Success (2) -> Info (1), then newest first
    notifications.sort((a, b) => {
      const priorityWeight = { urgent: 4, action: 3, success: 2, info: 1 };
      const weightDiff = (priorityWeight[b.severity] || 0) - (priorityWeight[a.severity] || 0);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    res.json({
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
};
