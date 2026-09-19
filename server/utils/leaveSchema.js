const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

async function ensureLeaveSchema() {
  const qi = sequelize.getQueryInterface();
  const columns = await qi.describeTable("leaves");

  const addIfMissing = async (name, definition) => {
    if (!columns[name]) {
      await qi.addColumn("leaves", name, definition);
      columns[name] = true;
    }
  };

  await addIfMissing("employee_name", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("department", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("days", { type: DataTypes.DECIMAL(5, 1), allowNull: true, defaultValue: 1 });
  await addIfMissing("half_day_session", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("contact_phone", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("approval_stage", { type: DataTypes.STRING, allowNull: true, defaultValue: "Supervisor" });
  await addIfMissing("supervisor_id", { type: DataTypes.INTEGER, allowNull: true });
  await addIfMissing("supervisor_name", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("supervisor_comment", { type: DataTypes.TEXT, allowNull: true });
  await addIfMissing("supervisor_reviewed_at", { type: DataTypes.DATE, allowNull: true });
  await addIfMissing("final_approver_id", { type: DataTypes.INTEGER, allowNull: true });
  await addIfMissing("final_approver_name", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("final_approver_comment", { type: DataTypes.TEXT, allowNull: true });
  await addIfMissing("final_approved_at", { type: DataTypes.DATE, allowNull: true });
  await addIfMissing("processor_id", { type: DataTypes.INTEGER, allowNull: true });
  await addIfMissing("processor_name", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("processed_at", { type: DataTypes.DATE, allowNull: true });
  await addIfMissing("reviewer_id", { type: DataTypes.INTEGER, allowNull: true });
  await addIfMissing("reviewer_name", { type: DataTypes.STRING, allowNull: true });
  await addIfMissing("review_comment", { type: DataTypes.TEXT, allowNull: true });
  await addIfMissing("reviewed_at", { type: DataTypes.DATE, allowNull: true });
  await addIfMissing("cancelled_at", { type: DataTypes.DATE, allowNull: true });
}

module.exports = { ensureLeaveSchema };
