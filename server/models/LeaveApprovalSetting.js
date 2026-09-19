const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LeaveApprovalSetting = sequelize.define(
  "LeaveApprovalSetting",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    companyName: { type: DataTypes.STRING, allowNull: false, unique: true },
    finalApproverId: { type: DataTypes.INTEGER, allowNull: true },
    processorId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "leave_approval_settings",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = LeaveApprovalSetting;
