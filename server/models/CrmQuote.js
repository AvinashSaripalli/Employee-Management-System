const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const CrmQuote = sequelize.define("CrmQuote", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  opportunityId: { type: DataTypes.INTEGER, allowNull: true },
  accountId: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: "Draft" },
  validUntil: { type: DataTypes.DATEONLY, allowNull: true },
  createdBy: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "crm_quotes", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
module.exports = CrmQuote;
