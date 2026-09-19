const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CrmOpportunity = sequelize.define("CrmOpportunity", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  accountId: { type: DataTypes.INTEGER, allowNull: true },
  leadId: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  stage: { type: DataTypes.STRING, allowNull: false, defaultValue: "Lead" },
  probability: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
  closeDate: { type: DataTypes.DATEONLY, allowNull: true },
  assignedTo: { type: DataTypes.STRING, allowNull: true },
  createdBy: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "crm_opportunities", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

module.exports = CrmOpportunity;
