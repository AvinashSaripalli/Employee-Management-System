const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Resignation = sequelize.define(
  "Resignation",
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
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "KN Advisors",
    },
    resignationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    requestedLastWorkingDay: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    approvedLastWorkingDay: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    noticePeriodDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    personalEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "Submitted",
        "Under Review",
        "Approved",
        "Clearance in Progress",
        "Completed",
        "Rejected",
        "Withdrawn"
      ),
      defaultValue: "Submitted",
    },
    managerApprovalStatus: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    managerComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerDecisionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hrApprovalStatus: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    hrComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hrDecisionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Multi-department Clearance Checklist
    itClearance: {
      type: DataTypes.ENUM("Pending", "Cleared"),
      defaultValue: "Pending",
    },
    itClearedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    itClearanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    financeClearance: {
      type: DataTypes.ENUM("Pending", "Cleared"),
      defaultValue: "Pending",
    },
    financeClearedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    financeClearanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminClearance: {
      type: DataTypes.ENUM("Pending", "Cleared"),
      defaultValue: "Pending",
    },
    adminClearedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminClearanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exitInterviewDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    exitInterviewFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    relievingLetterIssued: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "resignations",
    timestamps: true,
  }
);

module.exports = Resignation;
