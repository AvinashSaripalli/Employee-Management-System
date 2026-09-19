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
  stageEnteredAt: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  expectedRevenue: { type: DataTypes.FLOAT, allowNull: true },
  competitors: { type: DataTypes.TEXT, allowNull: true },
  lossReason: { type: DataTypes.STRING, allowNull: true },
  healthScore: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 75 },
  forecastCategory: { type: DataTypes.STRING, allowNull: true, defaultValue: "Pipeline" },
}, { tableName: "crm_opportunities", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

module.exports = CrmOpportunity;
