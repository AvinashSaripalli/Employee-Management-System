const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Report = sequelize.define(
  "Report",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.STRING,
    },
    companyName: {
      type: DataTypes.STRING,
    },
    department: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.DATEONLY,
    },
    taskName: {
      type: DataTypes.STRING,
      field: "task_name",
    },
    workDescription: {
      type: DataTypes.TEXT,
      field: "work_description",
    },
    hoursWorked: {
      type: DataTypes.FLOAT,
      field: "hours_worked",
    },
    feedback: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "reports",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Report;