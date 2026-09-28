const { Task, Leave, Report, Attendance, Message, User, AttendancePermission, Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * Advanced Notification Controller
 * Aggregates persistent database notifications with live operational alerts.
 */
exports.getNotifications = async (req, res) => {
  const employeeId = req.query.employeeId || req.user?.employeeId;
  const companyName = req.query.companyName || req.user?.companyName;
  const role = req.query.role || req.user?.role;
  const department = req.query.department || req.user?.department;
  const departmentRole = req.query.departmentRole || req.user?.departmentRole;

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
    // 0. PERSISTENT NOTIFICATIONS FROM DATABASE
    // -------------------------------------------------------------
    const dbNotifications = await Notification.findAll({
      where: {
        recipientId: employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
        isDismissed: false,
      },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    for (const n of dbNotifications) {
      notifications.push({
        id: `db-${n.id}`,
        dbId: n.id,
        isPersistent: true,
        isRead: Boolean(n.isRead),
        readAt: n.readAt,
        category: n.category,
        badge: n.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        severity: n.severity || 'info',
        actorName: n.senderName || 'System',
        subtitle: n.category ? n.category.toUpperCase() : 'NOTIFICATION',
        title: n.title,
        detail: n.message,
        createdAt: n.createdAt,
        target: n.target,
        targetId: n.targetId,
        actionLabel: n.actionLabel || 'View',
      });
    }

    // -------------------------------------------------------------
    // 1. ATTENDANCE & SHIFT OPERATIONAL ALERTS
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
        isPersistent: false,
        isRead: false,
        category: 'shift',
        badge: 'In Progress',
        severity: 'info',
        actorName: 'Time & Attendance',
        subtitle: `Clocked in at ${activeShift.clockInTime ? activeShift.clockInTime.slice(0, 5) : 'today'}`,
        title: 'Active Shift in Progress',
        detail: `You are currently clocked in. Remember to finalize tasks and file your daily work report upon completion.`,
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
            isPersistent: false,
            isRead: false,
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
            isPersistent: false,
            isRead: false,
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
    // 2. LIVE TASK NOTIFICATIONS (Overdue / Due Soon)
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
          isPersistent: false,
          isRead: false,
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
          targetId: task.id,
        });
      } else if (isDueSoon) {
        notifications.push({
          id: `task-due-${task.id}`,
          isPersistent: false,
          isRead: false,
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
          targetId: task.id,
        });
      }
    }

    // -------------------------------------------------------------
    // 3. MESSENGER NOTIFICATIONS (Privacy-Protected)
    // -------------------------------------------------------------
    // Only notify if conversation involves this specific employee or is company-wide
    const recentMessages = await Message.findAll({
      where: {
        companyName: { [Op.iLike]: effectiveCompany },
        senderEmployeeId: { [Op.ne]: employeeId },
        [Op.or]: [
          { conversationId: { [Op.like]: `%${employeeId}%` } },
          { conversationId: { [Op.like]: 'company:%' } },
        ],
      },
      order: [['id', 'DESC']],
      limit: 5,
    });

    for (const msg of recentMessages) {
      notifications.push({
        id: `msg-${msg.id}`,
        isPersistent: false,
        isRead: false,
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

    // Sort: Unread first, then by priority weight (urgent: 4, action: 3, success: 2, info: 1), then newest
    notifications.sort((a, b) => {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      const priorityWeight = { urgent: 4, action: 3, success: 2, info: 1 };
      const weightDiff = (priorityWeight[b.severity] || 0) - (priorityWeight[a.severity] || 0);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    res.json({
      total: notifications.length,
      unreadCount: notifications.filter((n) => !n.isRead).length,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user?.employeeId || req.body.employeeId;

  try {
    const rawId = String(id).replace(/^db-/, '');
    const numId = parseInt(rawId, 10);

    if (!isNaN(numId)) {
      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { id: numId, ...(employeeId ? { recipientId: employeeId } : {}) } }
      );
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Mark all notifications for this employee as read
 */
exports.markAllAsRead = async (req, res) => {
  const employeeId = req.user?.employeeId || req.body.employeeId;
  const companyName = req.user?.companyName || req.body.companyName;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          recipientId: employeeId,
          ...(companyName ? { companyName } : {}),
          isRead: false,
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Dismiss a single notification
 */
exports.dismissNotification = async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user?.employeeId || req.body.employeeId;

  try {
    const rawId = String(id).replace(/^db-/, '');
    const numId = parseInt(rawId, 10);

    if (!isNaN(numId)) {
      await Notification.update(
        { isDismissed: true },
        { where: { id: numId, ...(employeeId ? { recipientId: employeeId } : {}) } }
      );
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error dismissing notification:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Clear all read notifications
 */
exports.clearAllNotifications = async (req, res) => {
  const employeeId = req.user?.employeeId || req.body.employeeId;
  const companyName = req.user?.companyName || req.body.companyName;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  try {
    await Notification.update(
      { isDismissed: true },
      {
        where: {
          recipientId: employeeId,
          ...(companyName ? { companyName } : {}),
          isRead: true,
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ error: err.message });
  }
};
