const { AuditLog } = require('../models');

/**
 * Log a critical HR or administrative action to the immutable audit log table.
 *
 * @param {Object} params
 * @param {Object} [params.req] - Express request object (extracts actor, company, and IP)
 * @param {string} params.action - Event action code (e.g. USER_ROLE_UPDATED, LEAVE_APPROVED)
 * @param {string} params.targetType - Entity type (e.g. User, Leave, Attendance, Permission)
 * @param {string|number} [params.targetId] - Target entity primary key
 * @param {string} [params.targetEmployeeId] - Employee ID of the affected user (e.g. KN003)
 * @param {string} [params.targetName] - Name of the affected employee
 * @param {Object} [params.previousValues] - State before mutation
 * @param {Object} [params.newValues] - State after mutation
 * @param {string} [params.details] - Human-readable summary
 * @param {string} [params.companyName] - Explicit company override if req not provided
 */
async function logAuditEvent({
  req,
  action,
  targetType,
  targetId,
  targetEmployeeId,
  targetName,
  previousValues,
  newValues,
  details,
  companyName,
}) {
  try {
    const actorUser = req?.user || {};
    const effectiveCompany =
      companyName ||
      actorUser.companyName ||
      'KN Advisors';

    const actorId = actorUser.id || null;
    const actorEmployeeId = actorUser.employeeId || null;
    const actorRole = actorUser.role || 'System';
    const actorName =
      actorUser.firstName && actorUser.lastName
        ? `${actorUser.firstName} ${actorUser.lastName}`
        : actorUser.firstName || actorUser.name || 'Admin';

    const ipAddress =
      req?.headers?.['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      null;

    await AuditLog.create({
      companyName: effectiveCompany,
      actorId,
      actorEmployeeId,
      actorName,
      actorRole,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      targetEmployeeId: targetEmployeeId || null,
      targetName: targetName || null,
      previousValues: previousValues ? JSON.stringify(previousValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      details: typeof details === 'object' && details !== null ? JSON.stringify(details) : (details ? String(details) : null),
      ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
    });
  } catch (error) {
    // Non-blocking: Audit log failure should be reported but never crash main business flow
    console.error('Audit log write error:', error.message);
  }
}

module.exports = {
  logAuditEvent,
};
