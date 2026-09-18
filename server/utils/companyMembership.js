const { Op } = require("sequelize");
const { User } = require("../models");

const DEFAULT_COMPANY = "KN Advisors";
const COMPANY_PREFIXES = {
  "KN Advisors": "KN",
};

function isPresent(value) {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return Boolean(text) && text !== "null" && text !== "undefined";
}

async function generateEmployeeId(companyName = DEFAULT_COMPANY) {
  const prefix = COMPANY_PREFIXES[companyName] || "KN";
  const users = await User.findAll({
    where: {
      employeeId: { [Op.ne]: null },
    },
    attributes: ["employeeId"],
  });

  let max = 0;
  users.forEach((user) => {
    const id = String(user.employeeId || "").toUpperCase();
    if (!id.startsWith(prefix)) return;
    const number = parseInt(id.slice(prefix.length), 10);
    if (!Number.isNaN(number) && number > max) max = number;
  });

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

async function ensureCompanyMembership(user, companyName = DEFAULT_COMPANY) {
  if (!user) return null;

  const updates = {};
  if (!isPresent(user.companyName)) {
    updates.companyName = companyName;
  }
  if (!isPresent(user.employeeId)) {
    updates.employeeId = await generateEmployeeId(updates.companyName || user.companyName || companyName);
  }

  if (Object.keys(updates).length) {
    await user.update(updates);
  }
  return user;
}

async function backfillCompanyMembership() {
  const users = await User.findAll({
    where: { exists: 1 },
    order: [["id", "ASC"]],
  });
  for (const user of users) {
    await ensureCompanyMembership(user);
  }
}

module.exports = {
  DEFAULT_COMPANY,
  generateEmployeeId,
  ensureCompanyMembership,
  backfillCompanyMembership,
  isPresent,
};
