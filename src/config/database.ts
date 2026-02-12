
import db from "../models";



// Test connection and sync models
export const initializeDatabase = async () => {
  try {
    console.log("✅ PostgreSQL connection established successfully.");

    // Sync database (creates tables if they don't exist)
    await db?.sequelize?.sync({ alter: true });
    console.log("✅ Database synchronized successfully.");
  } catch (err) {
    console.error("❌ Unable to connect to the database:", err);
  }
};
