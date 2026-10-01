const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HelpdeskSetting = sequelize.define(
  "HelpdeskSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "company_name",
    },
    itApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "it_approver_id",
    },
    assetApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "asset_approver_id",
    },
    hrApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "hr_approver_id",
    },
    facilityApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "facility_approver_id",
    },
    autoAssignEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "auto_assign_enabled",
    },
    requireSupervisorApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "require_supervisor_approval",
    },
  },
  {
    tableName: "helpdesk_approval_settings",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = HelpdeskSetting;
