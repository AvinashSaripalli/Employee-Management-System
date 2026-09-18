const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TaskMember = sequelize.define(
  "TaskMember",
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
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "task_members",
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["task_id", "user_id", "type"],
      },
    ],
  }
);

module.exports = TaskMember;