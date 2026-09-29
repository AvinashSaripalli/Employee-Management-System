const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actorEmployeeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actorName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    actorRole: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. USER_ROLE_UPDATED, USER_STATUS_TOGGLED, LEAVE_REVIEWED, PERMISSION_REVIEWED
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: false, // e.g. User, Leave, Attendance, Permission
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetEmployeeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previousValues: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValues: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
    underscored: true,
    updatedAt: false, // Immutable: logs can NEVER be updated
    createdAt: 'created_at',
  }
);

module.exports = AuditLog;
