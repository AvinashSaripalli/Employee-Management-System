const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define(
  "Attendance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    companyName: {
      type: DataTypes.STRING,
    },
    department: {
      type: DataTypes.STRING,
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    employeeId: {
      type: DataTypes.STRING,
    },
    designation: {
      type: DataTypes.STRING,
    },
    clockInDate: {
      type: DataTypes.DATEONLY,
      field: "clock_in_date",
    },
    clockInTime: {
      type: DataTypes.TIME,
      field: "clock_in_time",
    },
    clockOutTime: {
      type: DataTypes.TIME,
      field: "clock_out_time",
    },
    workedTime: {
      type: DataTypes.STRING,
      field: "worked_time",
    },
  },
  {
    tableName: "attendance",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Attendance;