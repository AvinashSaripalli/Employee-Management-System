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
    employeeName: {
      type: DataTypes.STRING,
      field: "employee_name",
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
    clockInTime: {
      type: DataTypes.TIME,
      field: "clock_in_time",
    },
    clockOutTime: {
      type: DataTypes.TIME,
      field: "clock_out_time",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Submitted",
    },
    feedback: {
      type: DataTypes.TEXT,
      defaultValue: "Pending",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "reports",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
    hooks: {
      beforeUpdate: (report) => {
        report.updatedAt = new Date();
      },
    },
  }
);

module.exports = Report;