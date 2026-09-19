const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CrmLead = sequelize.define("CrmLead", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  accountName: { type: DataTypes.STRING, allowNull: true },
  source: { type: DataTypes.STRING, allowNull: false, defaultValue: "Website" },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "New" },
  score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
  value: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  assignedTo: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "crm_leads", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

module.exports = CrmLead;
