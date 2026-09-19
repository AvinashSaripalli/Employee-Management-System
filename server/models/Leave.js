const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Leave = sequelize.define(
  "Leave",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.STRING,
    },
    employee_name: {
      type: DataTypes.STRING,
    },
    department: {
      type: DataTypes.STRING,
    },
    leave_type: {
      type: DataTypes.STRING,
    },
    start_date: {
      type: DataTypes.DATEONLY,
    },
    end_date: {
      type: DataTypes.DATEONLY,
    },
    days: {
      type: DataTypes.DECIMAL(5, 1),
      defaultValue: 1,
    },
    reason: {
      type: DataTypes.TEXT,
    },
    only_tomorrow: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    half_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    half_day_session: {
      type: DataTypes.STRING,
    },
    contact_phone: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
    approval_stage: {
      type: DataTypes.STRING,
      defaultValue: "Supervisor",
    },
    supervisor_id: { type: DataTypes.INTEGER },
    supervisor_name: { type: DataTypes.STRING },
    supervisor_comment: { type: DataTypes.TEXT },
    supervisor_reviewed_at: { type: DataTypes.DATE },
    final_approver_id: { type: DataTypes.INTEGER },
    final_approver_name: { type: DataTypes.STRING },
    final_approver_comment: { type: DataTypes.TEXT },
    final_approved_at: { type: DataTypes.DATE },
    processor_id: { type: DataTypes.INTEGER },
    processor_name: { type: DataTypes.STRING },
    processed_at: { type: DataTypes.DATE },
    reviewer_id: {
      type: DataTypes.INTEGER,
    },
    reviewer_name: {
      type: DataTypes.STRING,
    },
    review_comment: {
      type: DataTypes.TEXT,
    },
    reviewed_at: {
      type: DataTypes.DATE,
    },
    cancelled_at: {
      type: DataTypes.DATE,
    },
    companyName: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "leaves",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Leave;
