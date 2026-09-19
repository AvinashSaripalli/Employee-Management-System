const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const CrmProduct = sequelize.define("CrmProduct", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  cost: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "crm_products", underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
module.exports = CrmProduct;
