const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Leave = sequelize.define(
  "Leave",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.STRING,
    },
    leave_type: {
      type: DataTypes.STRING,
    },
    start_date: {
      type: DataTypes.DATEONLY,
    },
    end_date: {
      type: DataTypes.DATEONLY,
    },
    reason: {
      type: DataTypes.TEXT,
    },
    only_tomorrow: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    half_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
    companyName: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "leaves",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Leave;