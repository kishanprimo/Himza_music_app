import { subscription_service } from "../services";
import cron from "node-cron";

export default function removeExpieredSubscriptions() {
  // Run daily at 05:47 server time
  cron.schedule("47 5 * * *", async () => {
    try {
      console.log("Removing expired subscriptions...");
      await subscription_service.removeExpieredSubscriptions();
      console.log("Expired subscriptions removed successfully.");
    } catch (err) {
      console.error("Failed to remove expired subscriptions:", err);
    }
  });
}
