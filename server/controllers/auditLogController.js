const { AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.getAuditLogs = async (req, res) => {
  const actorRole = (req.user?.role || '').toLowerCase();
  if (actorRole !== 'admin' && actorRole !== 'hr') {
    return res.status(403).json({ error: 'Access denied. Only Administrators and HR can view system audit logs.' });
  }

  const {
    companyName: reqCompanyName,
    action,
    targetType,
    employeeId,
    limit = 50,
    offset = 0,
    search,
  } = req.query;

  const companyName = reqCompanyName || req.user?.companyName || 'KN Advisors';

  try {
    const whereClause = {
      companyName: { [Op.iLike]: companyName },
    };

    if (action) {
      whereClause.action = action;
    }

    if (targetType) {
      whereClause.targetType = targetType;
    }

    if (employeeId) {
      whereClause[Op.or] = [
        { targetEmployeeId: employeeId },
        { actorEmployeeId: employeeId },
      ];
    }

    if (search) {
      whereClause[Op.or] = [
        { details: { [Op.iLike]: `%${search}%` } },
        { targetName: { [Op.iLike]: `%${search}%` } },
        { actorName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: Math.min(Number(limit) || 50, 100),
      offset: Number(offset) || 0,
    });

    res.json({
      total: count,
      logs: rows,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
};
