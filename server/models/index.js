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
const AttendancePermission = require("./AttendancePermission");
const AttendanceRegularization = require("./AttendanceRegularization");
const Asset = require("./Asset");
const Resignation = require("./Resignation");
const Shift = require("./Shift");
const ShiftSchedule = require("./ShiftSchedule");
const Notification = require("./Notification");
const AuditLog = require("./AuditLog");
const SupportTicket = require("./SupportTicket");

Notification.belongsTo(User, {
  foreignKey: "recipientId",
  targetKey: "employeeId",
  as: "recipient",
  constraints: false,
});
User.hasMany(Notification, {
  foreignKey: "recipientId",
  sourceKey: "employeeId",
  as: "notifications",
  constraints: false,
});

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

Report.belongsTo(User, {
  foreignKey: "employeeId",
  targetKey: "employeeId",
  as: "employee",
  constraints: false,
});
User.hasMany(Report, {
  foreignKey: "employeeId",
  sourceKey: "employeeId",
  as: "reports",
  constraints: false,
});

ShiftSchedule.belongsTo(Shift, {
  foreignKey: "shiftId",
  as: "shift",
  constraints: false,
});
Shift.hasMany(ShiftSchedule, {
  foreignKey: "shiftId",
  as: "schedules",
  constraints: false,
});

SupportTicket.belongsTo(Asset, {
  foreignKey: "allocatedAssetId",
  as: "allocatedAsset",
  constraints: false,
});
SupportTicket.belongsTo(User, {
  foreignKey: "assignedToId",
  as: "assignee",
  constraints: false,
});

const HelpdeskSetting = require("./HelpdeskSetting");

HelpdeskSetting.belongsTo(User, {
  foreignKey: "itApproverId",
  as: "itApprover",
  constraints: false,
});
HelpdeskSetting.belongsTo(User, {
  foreignKey: "assetApproverId",
  as: "assetApprover",
  constraints: false,
});
HelpdeskSetting.belongsTo(User, {
  foreignKey: "hrApproverId",
  as: "hrApprover",
  constraints: false,
});
HelpdeskSetting.belongsTo(User, {
  foreignKey: "facilityApproverId",
  as: "facilityApprover",
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
  AttendancePermission,
  AttendanceRegularization,
  Asset,
  Resignation,
  Shift,
  ShiftSchedule,
  Notification,
  AuditLog,
  SupportTicket,
  HelpdeskSetting,
};