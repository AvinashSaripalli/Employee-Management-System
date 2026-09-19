const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    conversationId: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    senderEmployeeId: { type: DataTypes.STRING, allowNull: false },
    senderName: { type: DataTypes.STRING, allowNull: false },
    senderPhoto: { type: DataTypes.STRING, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    messageType: { type: DataTypes.STRING, allowNull: false, defaultValue: "text" },
    fileUrl: { type: DataTypes.STRING, allowNull: true },
    fileName: { type: DataTypes.STRING, allowNull: true },
    replyToId: { type: DataTypes.INTEGER, allowNull: true },
    isEdited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reactions: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
  },
  {
    tableName: "messages",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Message;
