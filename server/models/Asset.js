const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Asset = sequelize.define(
  "Asset",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assetTag: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Laptop",
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    purchaseCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    warrantyExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    condition: {
      type: DataTypes.ENUM("New", "Excellent", "Good", "Fair", "Damaged", "Needs Repair"),
      defaultValue: "Good",
    },
    status: {
      type: DataTypes.ENUM("Available", "Assigned", "Under Repair", "Retired", "Lost"),
      defaultValue: "Available",
    },
    assignedToEmployeeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedToName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedToDepartment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expectedReturnDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    returnedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "KN Advisors",
    },
  },
  {
    tableName: "assets",
    timestamps: true,
  }
);

module.exports = Asset;
