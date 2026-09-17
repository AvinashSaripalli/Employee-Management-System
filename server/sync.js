const { sequelize } = require("./models");

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Connected...");

    await sequelize.sync({ alter: true });
    console.log("Database tables created/synced successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Database sync error:", error);
    process.exit(1);
  }
}

syncDatabase();