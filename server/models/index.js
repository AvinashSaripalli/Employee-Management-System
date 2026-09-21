const sequelize = require("../config/database");
const User = require("./User");
const Leave = require("./Leave");
const LeaveApprovalSetting = require("./LeaveApprovalSetting");
const Attendance = require("./Attendance");
const Report = require("./Report");
const Workgroup = require("./Workgroup");
const Task = require("./Task");
const TaskChecklistItem = require("./TaskChecklistItem");
const TaskActivity = require("./TaskActivity");
const TaskMember = require("./TaskMember");
const Department = require("./Department");
const Message = require("./Message");
const CrmLead = require("./CrmLead");
const CrmAccount = require("./CrmAccount");
const CrmOpportunity = require("./CrmOpportunity");
const CrmActivity = require("./CrmActivity");
const CrmContact = require("./CrmContact");
const CrmProduct = require("./CrmProduct");
const CrmQuote = require("./CrmQuote");

Workgroup.belongsTo(User, {
  foreignKey: "employeeId",
  targetKey: "employeeId",
  as: "user",
  constraints: false,
});
Workgroup.belongsTo(User, {
  foreignKey: "leaderId",
  targetKey: "employeeId",
  as: "leader",
  constraints: false,
});
User.hasMany(Workgroup, {
  foreignKey: "employeeId",
  sourceKey: "employeeId",
  as: "workgroups",
  constraints: false,
});

Task.hasMany(TaskChecklistItem, {
  foreignKey: "taskId",
  as: "checklist",
  onDelete: "CASCADE",
});
TaskChecklistItem.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
  onDelete: "CASCADE",
});

Task.belongsTo(Task, {
  foreignKey: "parentId",
  as: "parent",
  constraints: false,
});
Task.hasMany(Task, {
  foreignKey: "parentId",
  as: "subtasks",
  constraints: false,
});

Task.belongsTo(User, {
  foreignKey: "responsibleId",
  targetKey: "employeeId",
  as: "responsible",
  constraints: false,
});
Task.belongsTo(User, {
  foreignKey: "createdBy",
  targetKey: "employeeId",
  as: "creator",
  constraints: false,
});

TaskActivity.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
  onDelete: "CASCADE",
});
Task.hasMany(TaskActivity, {
  foreignKey: "taskId",
  as: "activities",
  onDelete: "CASCADE",
});
TaskActivity.belongsTo(User, {
  foreignKey: "userId",
  targetKey: "employeeId",
  as: "user",
  constraints: false,
});

TaskMember.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
  onDelete: "CASCADE",
});
Task.hasMany(TaskMember, {
  foreignKey: "taskId",
  as: "members",
  onDelete: "CASCADE",
});
TaskMember.belongsTo(User, {
  foreignKey: "userId",
  targetKey: "employeeId",
  as: "user",
  constraints: false,
});

Department.belongsTo(Department, { foreignKey: "parentId", as: "parent", constraints: false });
Department.hasMany(Department, { foreignKey: "parentId", as: "children", constraints: false });

Leave.belongsTo(User, {
  foreignKey: "employeeId",
  targetKey: "employeeId",
  as: "employee",
  constraints: false,
});
User.hasMany(Leave, {
  foreignKey: "employeeId",
  sourceKey: "employeeId",
  as: "leaves",
  constraints: false,
});

module.exports = {
  sequelize,
  User,
  Leave,
  LeaveApprovalSetting,
  Attendance,
  Report,
  Workgroup,
  Task,
  TaskChecklistItem,
  TaskActivity,
  TaskMember,
  Department,
  Message,
  CrmLead,
  CrmAccount,
  CrmOpportunity,
  CrmActivity,
  CrmContact,
  CrmProduct,
  CrmQuote,
};