import dotenv from "dotenv";
import { logger } from "../../utils";
dotenv.config();

const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID as string;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY as string;
const ANDROID_CHANNEL_ID = process.env.ANDROID_CHANNEL_ID as string;

const ONE_SIGNAL_APP_ID_BUSINESS = process.env.ONE_SIGNAL_APP_ID_BUSINESS as string;
const ONE_SIGNAL_API_KEY_BUSINESS = process.env.ONE_SIGNAL_API_KEY_BUSINESS as string;
const ANDROID_CHANNEL_ID_BUSINESS = process.env.ANDROID_CHANNEL_ID_BUSINESS as string;

/**
 * Interface for push notification params
 */
interface SendPushNotificationParams {
  playerIds?: string[];
  title: string;
  message: string;
  big_picture?: string;
  large_icon?: string;
  appLogo?: string;
  data?: Record<string, any>;
  broadcast?: boolean;
  collapse_id?: string;
}

/**
 * Sends push notification via OneSignal REST API
 */
export const sendPushNotification = async ({
  playerIds,
  title,
  message,
  big_picture,
  large_icon,
  appLogo,
  data = {},
  broadcast = false,
  collapse_id = Date.now().toString(),
}: SendPushNotificationParams): Promise<any> => {
  // ✅ Filter invalid player IDs
  const validPlayerIds = playerIds?.filter((id) => id && id !== "");

  const notification: any = {
    app_id: ONE_SIGNAL_APP_ID,
    headings: { en: title },
    contents: { en: message },
    data,
    small_icon: appLogo,
    android_channel_id: ANDROID_CHANNEL_ID,
    collapse_id,
  };

  const notification_business: any = {
    app_id: ONE_SIGNAL_APP_ID_BUSINESS,
    headings: { en: title },
    contents: { en: message },
    data,
    small_icon: appLogo,
    android_channel_id: ANDROID_CHANNEL_ID_BUSINESS,
    collapse_id,
  };

  // ✅ Target specific users or broadcast
  if (validPlayerIds && validPlayerIds.length > 0) {
    notification.include_player_ids = validPlayerIds;
    notification_business.include_player_ids = validPlayerIds;
  } else if (broadcast) {
    notification.included_segments = ["All"];
    notification_business.included_segments = ["All"];
  }

  // ✅ Large icon handling
  if (large_icon) {
    notification.chrome_web_image = large_icon;
    notification.large_icon = large_icon;
    notification.ios_attachments = { id1: large_icon };

    notification_business.chrome_web_image = large_icon;
    notification_business.large_icon = large_icon;
    notification_business.ios_attachments = { id1: large_icon };
  }

  // ✅ Big picture handling
  if (big_picture) {
    notification.big_picture = big_picture;
    notification.ios_attachments = {
      ...(notification.ios_attachments || {}),
      id2: big_picture,
    };

    notification_business.big_picture = big_picture;
    notification_business.ios_attachments = {
      ...(notification_business.ios_attachments || {}),
      id2: big_picture,
    };
  }

  try {
    const [response, responseBusiness] = await Promise.all([
      fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      }),
      fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          Authorization: `Basic ${ONE_SIGNAL_API_KEY_BUSINESS}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification_business),
      }),
    ]);

    const data1 = await response.json();
    const data2 = await responseBusiness.json();

    return { userApp: data1, businessApp: data2 };
  } catch (error: any) {
    logger.error(
      "OneSignal API error:",
      error?.response?.data || error.message || error
    );
    throw new Error("Failed to send notification");
  }
};