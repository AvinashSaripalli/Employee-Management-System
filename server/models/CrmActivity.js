const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CrmActivity = sequelize.define("CrmActivity", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: "Call" },
  subject: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  relatedType: { type: DataTypes.STRING, allowNull: true },
  relatedId: { type: DataTypes.INTEGER, allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdBy: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "crm_activities", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

module.exports = CrmActivity;
