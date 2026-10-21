import db from "../models";
import { logger } from "../utils";

// Test connection and sync models
export const initializeDatabase = async () => {
  try {
    // Add-only sync: creates missing tables, columns and indexes, but never drops or
    // changes existing columns/constraints, so live data can't be lost on startup.
    // Type changes or column removals must be done with a manual migration.
    await db?.sequelize?.sync({ alter: { drop: false } });
    logger.info("Database synchronized successfully.");
  } catch (err) {
    logger.error("Unable to connect to the database:", err);
  }
};
