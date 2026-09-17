const sequelize = require("../config/database");
const User = require("./User");
const Leave = require("./Leave");
const Attendance = require("./Attendance");
const Report = require("./Report");
const Workgroup = require("./Workgroup");

Workgroup.belongsTo(User, {
  foreignKey: "employeeId",
  targetKey: "employeeId",
  as: "user",
  constraints: false,
});
User.hasMany(Workgroup, {
  foreignKey: "employeeId",
  sourceKey: "employeeId",
  as: "workgroups",
  constraints: false,
});

module.exports = {
  sequelize,
  User,
  Leave,
  Attendance,
  Report,
  Workgroup,
};