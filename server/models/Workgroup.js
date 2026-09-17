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
    createdOn: {
      type: DataTypes.DATE,
      field: "created_on",
    },
    privacyType: {
      type: DataTypes.STRING,
      field: "privacy_type",
    },
    employeeId: {
      type: DataTypes.STRING,
    },
    partnerCompanyName: {
      type: DataTypes.STRING,
      field: "partner_company_name",
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