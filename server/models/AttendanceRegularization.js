const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttendanceRegularization = sequelize.define(
  "AttendanceRegularization",
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    regularizationType: {
      type: DataTypes.STRING, // 'Missed Punch' | 'On Duty / Field Work' | 'Technical Glitch' | 'Remote Work'
      allowNull: false,
      defaultValue: "Missed Punch",
    },
    requestedClockInTime: {
      type: DataTypes.STRING, // e.g. '09:30:00'
      allowNull: false,
    },
    requestedClockOutTime: {
      type: DataTypes.STRING, // e.g. '18:30:00'
      allowNull: false,
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
      type: DataTypes.STRING,
    },
    reviewerComment: {
      type: DataTypes.TEXT,
    },
    reviewedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "attendance_regularizations",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = AttendanceRegularization;
