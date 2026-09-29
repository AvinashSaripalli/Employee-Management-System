const { Notification, User } = require('../models');

/**
 * Dispatch a notification to a specific recipient.
 * Persists to database and pushes via Socket.IO if active.
 */
async function dispatchNotification(appOrIo, {
  recipientId,
  senderId = null,
  senderName = null,
  companyName,
  category = 'system',
  type = 'general',
  title,
  message = '',
  severity = 'info',
  target = null,
  targetId = null,
  actionLabel = 'View',
}) {
  if (!recipientId || !companyName || !title) return null;

  try {
    const record = await Notification.create({
      recipientId,
      senderId,
      senderName,
      companyName,
      category,
      type,
      title,
      message,
      severity,
      target,
      targetId: targetId ? String(targetId) : null,
      actionLabel,
      isRead: false,
      isDismissed: false,
    });

    // Real-time socket delivery
    try {
      const io = appOrIo?.get ? appOrIo.get('io') : appOrIo;
      if (io) {
        io.to(`user:${recipientId}`).emit('notification:new', record.toJSON());
      }
    } catch (socketErr) {
      console.warn('Socket notification emit error:', socketErr.message);
    }

    return record;
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
    return null;
  }
}

/**
 * Notify all Admins and Supervisors of a specific department
 */
async function notifyAdminsAndSupervisors(appOrIo, {
  department,
  companyName,
  excludeEmployeeId = null,
  senderId = null,
  senderName = null,
  category,
  type,
  title,
  message,
  severity = 'action',
  target,
  targetId = null,
  actionLabel = 'Review',
}) {
  try {
    const { Op } = require('sequelize');
    const recipients = await User.findAll({
      where: {
        companyName,
        [Op.or]: [
          { role: { [Op.in]: ['Admin', 'HR'] } },
          {
            departmentRole: 'Supervisor',
            ...(department ? { department: { [Op.iLike]: department.trim() } } : {}),
          },
          {
            role: 'Manager',
            ...(department ? { department: { [Op.iLike]: department.trim() } } : {}),
          },
        ],
      },
      attributes: ['employeeId', 'role', 'departmentRole'],
    });

    const uniqueRecipients = new Set();
    for (const u of recipients) {
      if (u.employeeId && u.employeeId !== excludeEmployeeId) {
        uniqueRecipients.add(u.employeeId);
      }
    }

    // Automatically include acting/delegated supervisors for this department
    if (department) {
      try {
        const { Department } = require('../models');
        const dept = await Department.findOne({
          where: { name: department, companyName },
          attributes: ['supervisorId', 'delegatedSupervisorId'],
        });
        if (dept?.delegatedSupervisorId) {
          const delUser = await User.findByPk(dept.delegatedSupervisorId, { attributes: ['employeeId'] });
          if (delUser?.employeeId && delUser.employeeId !== excludeEmployeeId) {
            uniqueRecipients.add(delUser.employeeId);
          }
        }
        if (dept?.supervisorId) {
          const sup = await User.findByPk(dept.supervisorId, { attributes: ['delegatedToId'] });
          if (sup?.delegatedToId) {
            const delUser = await User.findByPk(sup.delegatedToId, { attributes: ['employeeId'] });
            if (delUser?.employeeId && delUser.employeeId !== excludeEmployeeId) {
              uniqueRecipients.add(delUser.employeeId);
            }
          }
        }
      } catch (deptErr) {
        console.warn('Delegation lookup warning in notifyAdminsAndSupervisors:', deptErr.message);
      }
    }

    const promises = Array.from(uniqueRecipients).map((empId) =>
      dispatchNotification(appOrIo, {
        recipientId: empId,
        senderId,
        senderName,
        companyName,
        category,
        type,
        title,
        message,
        severity,
        target,
        targetId,
        actionLabel,
      })
    );

    return await Promise.all(promises);
  } catch (err) {
    console.error('Failed to notify admins and supervisors:', err);
    return [];
  }
}

module.exports = {
  dispatchNotification,
  notifyAdminsAndSupervisors,
};
