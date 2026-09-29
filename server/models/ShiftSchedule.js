const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ShiftSchedule = sequelize.define(
  "ShiftSchedule",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    employeeName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "KN Advisors",
    },
    shiftId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isWeeklyOff: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "shift_schedules",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["employeeId", "date", "companyName"],
      },
    ],
  }
);

module.exports = ShiftSchedule;
