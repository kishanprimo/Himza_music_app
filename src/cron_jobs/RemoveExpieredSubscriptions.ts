import { subscription_service } from "../services";
import cron from "node-cron";
import { logger } from "../utils";

export default function removeExpieredSubscriptions() {
  // Run daily at 05:47 server time
  cron.schedule("47 5 * * *", async () => {
    try {
      await subscription_service.removeExpieredSubscriptions();
      logger.info("Expired subscriptions removed successfully.");
    } catch (err) {
      logger.error("Failed to remove expired subscriptions:", err);
    }
  });
}
