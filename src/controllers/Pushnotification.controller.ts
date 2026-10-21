import { sendPushNotification } from "../services/common/oneSignal.service";
import { Request, Response } from "express";
import db from "../models";
import { generalResponse } from "../helpers/response.helper";

const { Broadcast_push_notification } = db;
// 🔹 Types for request body
interface BroadcastRequestBody {
  title: string;
  message: string;
}

// 🔹 Broadcast Message
export const broadcastMessage = async (
  req: Request<{}, {}, BroadcastRequestBody>,
  res: Response
): Promise<Response> => {
  try {
    const { title, message } = req.body;

    if (!title && !message) {
      return generalResponse(
        res,
        {},
        "Data is Missing",
        false,
        true,
        402
      );
    }


    const result = await sendPushNotification({
      title: `${title}`,
      message: `${message}`,
      // appLogo: project_conf.app_logo_light,
      data: {
        type: "broadcast",
      },
      broadcast: true,
    });

    await Broadcast_push_notification.create({
      title,
      message,
    });

    return generalResponse(
      res,
      result,
      "Notification sent successfully",
      true,
      false,
      200
    );
  } catch (error: any) {
    console.error("Error in broadcasting message:", error);
    return generalResponse(
      res,
      {},
      error.message,
      false,
      true,
      500
    );
  }
};

// 🔹 Get Broadcast Messages
export const getBroadcastMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = parseInt(req.body?.page) || 1;
    const pageSize = parseInt(req.body?.pageSize) || 10;

    if (page < 1 || pageSize < 1) {
      return generalResponse(
        res,
        {},
        "Page and pageSize must be positive numbers",
        false,
        true,
        400
      );
    }

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const { rows, count } =
      await Broadcast_push_notification.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

    return generalResponse(
      res,
      {
        records: rows,
        pagination: {
          total_pages: Math.ceil(count / pageSize),
          total_records: Number(count),
          current_page: page,
          records_per_page: pageSize,
        },
      },
      "Notifications retrieved successfully",
      true,
      false,
      200
    );
  } catch (error: any) {
    console.error("Error in retrieving broadcast messages:", error);
    return generalResponse(
      res,
      {},
      error.message,
      false,
      true,
      500
    );
  }
};

// 🔹 Backward compatibility export
export const getbroadcastMessage = getBroadcastMessage;
