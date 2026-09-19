const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CrmAccount = sequelize.define("CrmAccount", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  industry: { type: DataTypes.STRING, allowNull: true },
  size: { type: DataTypes.STRING, allowNull: true },
  website: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  ownerId: { type: DataTypes.STRING, allowNull: true },
}, { tableName: "crm_accounts", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });

module.exports = CrmAccount;
