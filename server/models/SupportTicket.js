const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SupportTicket = sequelize.define(
  "SupportTicket",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticketNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "ticket_number",
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "IT_SUPPORT", // 'IT_SUPPORT', 'ASSET_REQUEST', 'HR_REQUEST', 'FACILITY'
    },
    subCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "sub_category", // 'Hardware', 'Software', 'Access', 'Laptop', 'Monitor', 'Letter', etc.
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: "Medium", // 'Low', 'Medium', 'High', 'Critical'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Open", // 'Open', 'In Progress', 'Waiting on Employee', 'Resolved', 'Closed', 'Rejected'
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "employee_id",
    },
    employeeName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "employee_name",
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "company_name",
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "assigned_to_id",
    },
    assignedToName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "assigned_to_name",
    },
    targetAssetCategory: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "target_asset_category", // 'Laptop', 'Monitor', 'Peripherals', etc.
    },
    allocatedAssetId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "allocated_asset_id",
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "resolution_notes",
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "resolved_at",
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "closed_at",
    },
  },
  {
    tableName: "support_tickets",
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = SupportTicket;
