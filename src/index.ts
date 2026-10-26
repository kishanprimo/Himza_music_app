import { app } from "./app";
import { logger } from "./utils";
import { initializeSocketIO } from "./socket";
import { config } from "./config";
import { initializeDatabase } from "./config/database";
import removeExpieredSubscriptions from "./cron_jobs/RemoveExpieredSubscriptions";

// Start the server
const startServer = async (): Promise<void> => {
  try {
    try {
      await initializeDatabase();
      // setupAssociations();
      removeExpieredSubscriptions();
      logger.info("DB synced and models ready.");
    } catch (err) {
      logger.error("Sync failed:", err);
    }

    logger.info("Connected to PostgreSQL successfully");


    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);

       // 👉 Call seed function AFTER DB sync
    //  seedAdmin();
    });

    

    // Initialize Socket.IO with the server
    initializeSocketIO(server);
    logger.info("Socket.IO initialized successfully");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions and rejections
// Wait for the file transport to flush so the crash reason is not lost.
const exitAfterLogFlush = () => {
  logger.on("finish", () => process.exit(1));
  logger.end();
  setTimeout(() => process.exit(1), 2000).unref();
};

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  exitAfterLogFlush();
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error);
  exitAfterLogFlush();
});

startServer();
