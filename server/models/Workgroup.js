const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Workgroup = sequelize.define(
  "Workgroup",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    companyName: {
      type: DataTypes.STRING,
    },
    groupName: {
      type: DataTypes.STRING,
      field: "group_name",
      allowNull: true,
    },
    partnerCompanyName: {
      type: DataTypes.STRING,
      field: "partner_company_name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: "Project Pod",
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Active",
      allowNull: true,
    },
    leaderId: {
      type: DataTypes.STRING,
      field: "leader_id",
      allowNull: true,
    },
    memberRole: {
      type: DataTypes.STRING,
      field: "member_role",
      defaultValue: "Member",
      allowNull: true,
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resources: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    announcements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdOn: {
      type: DataTypes.DATE,
      field: "created_on",
    },
    privacyType: {
      type: DataTypes.STRING,
      field: "privacy_type",
      defaultValue: "Private",
    },
    employeeId: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "workgroups",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Workgroup;