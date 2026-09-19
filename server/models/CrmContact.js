const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const CrmContact = sequelize.define("CrmContact", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  accountId: { type: DataTypes.INTEGER, allowNull: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: true },
  ownerId: { type: DataTypes.STRING, allowNull: true },
  isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: "crm_contacts", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
module.exports = CrmContact;
