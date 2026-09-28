const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipientId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "recipient_id",
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "sender_id",
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "sender_name",
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "company_name",
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "system", // 'task', 'leave', 'attendance', 'report', 'message', 'system'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "general", // 'task_assigned', 'task_review', 'task_completed', 'leave_applied', 'leave_approved', 'leave_rejected', 'permission_requested', 'permission_reviewed', 'report_submitted', 'report_feedback', 'message_received'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    severity: {
      type: DataTypes.STRING,
      defaultValue: "info", // 'info', 'action', 'urgent', 'success'
    },
    target: {
      type: DataTypes.STRING,
      allowNull: true, // Navigation target module name
    },
    targetId: {
      type: DataTypes.STRING,
      allowNull: true, // Specific ID to open / view (e.g. task ID, leave ID)
      field: "target_id",
    },
    actionLabel: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "View",
      field: "action_label",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_read",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
    isDismissed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_dismissed",
    },
  },
  {
    tableName: "notifications",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Notification;
