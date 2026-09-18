const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    createdBy: {
      type: DataTypes.STRING,
      field: "created_by",
    },
    responsibleId: {
      type: DataTypes.STRING,
      field: "responsible_id",
    },
    deadline: {
      type: DataTypes.DATE,
    },
    parentId: {
      type: DataTypes.INTEGER,
      field: "parent_id",
    },
    companyName: {
      type: DataTypes.STRING,
      field: "company_name",
    },
    taskControl: {
      type: DataTypes.BOOLEAN,
      field: "task_control",
      defaultValue: false,
    },
    completedBy: {
      type: DataTypes.STRING,
      field: "completed_by",
    },
    completedAt: {
      type: DataTypes.DATE,
      field: "completed_at",
    },
  },
  {
    tableName: "tasks",
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Task;