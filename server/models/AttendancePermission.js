const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttendancePermission = sequelize.define(
  "AttendancePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    employeeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
    },
    companyName: {
      type: DataTypes.STRING,
      defaultValue: "KN Advisors",
    },
    permissionType: {
      type: DataTypes.STRING, // 'Late Sign-In' | 'Early Sign-Out'
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expectedTime: {
      type: DataTypes.STRING, // e.g. '10:30' or '16:30'
      allowNull: false,
    },
    durationHours: {
      type: DataTypes.DECIMAL(3, 1), // 0.5, 1.0, 1.5, 2.0
      allowNull: false,
      defaultValue: 1.0,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING, // 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
      defaultValue: "Pending",
    },
    reviewerId: {
      type: DataTypes.STRING,
    },
    reviewerName: {
      type: DataTypes.STRING,
    },
    reviewerRole: {
      type: DataTypes.STRING, // 'Supervisor' | 'Manager' | 'Admin' | 'HR'
    },
    reviewerComment: {
      type: DataTypes.TEXT,
    },
    reviewedAt: {
      type: DataTypes.DATE,
    },
    cancelledAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "attendance_permissions",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = AttendancePermission;
