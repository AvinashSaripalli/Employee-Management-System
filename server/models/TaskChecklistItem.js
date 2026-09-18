const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TaskChecklistItem = sequelize.define(
  "TaskChecklistItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      field: "task_id",
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      field: "is_complete",
      defaultValue: false,
    },
    sortIndex: {
      type: DataTypes.INTEGER,
      field: "sort_index",
      defaultValue: 0,
    },
  },
  {
    tableName: "task_checklist_items",
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = TaskChecklistItem;