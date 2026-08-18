import { logger } from "../utils";
import { getAllAvatars, response_service } from "../services";
import { Request, Response } from "express";

export const getAllAvatarsController = async (req: Request, res: Response) => {
  try {
    const avatars = await getAllAvatars();
    return response_service.successResponse(
      res,
      "Avatars retrieved successfully.",
      avatars
    );
  } catch (err: any) {
    logger.error("Error retrieving avatars:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
};
