const { sequelize } = require("./models");

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Connected...");
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
  }
}

testConnection();

module.exports = sequelize;