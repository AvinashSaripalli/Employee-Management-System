const { sequelize } = require("./models");

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Connected...");

    await sequelize.sync({ alter: true });
    console.log("Database tables created/synced successfully.");

    const { User } = require("./models");
    const { Op } = require("sequelize");
    const [affectedCount] = await User.update(
      { companyName: "KN Advisors" },
      {
        where: {
          [Op.or]: [
            { companyName: null },
            { companyName: { [Op.ne]: "KN Advisors" } }
          ]
        }
      }
    );
    console.log(`Updated ${affectedCount} user(s) to company 'KN Advisors'.`);

    process.exit(0);
  } catch (error) {
    console.error("Database sync error:", error);
    process.exit(1);
  }
}

syncDatabase();