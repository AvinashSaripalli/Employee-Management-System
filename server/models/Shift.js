const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Shift = sequelize.define(
  "Shift",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "GS",
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "09:00",
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "18:00",
    },
    graceMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    halfDayHours: {
      type: DataTypes.FLOAT,
      defaultValue: 4.0,
    },
    fullDayHours: {
      type: DataTypes.FLOAT,
      defaultValue: 8.0,
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: "#14286D",
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "KN Advisors",
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "shifts",
    timestamps: true,
  }
);

module.exports = Shift;
