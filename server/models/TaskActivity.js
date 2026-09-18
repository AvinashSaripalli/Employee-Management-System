const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TaskActivity = sequelize.define(
  "TaskActivity",
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
    userId: {
      type: DataTypes.STRING,
      field: "user_id",
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    field: {
      type: DataTypes.STRING,
    },
    oldValue: {
      type: DataTypes.STRING,
      field: "old_value",
    },
    newValue: {
      type: DataTypes.STRING,
      field: "new_value",
    },
  },
  {
    tableName: "task_activities",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = TaskActivity;