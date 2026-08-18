import { dashboard_service, response_service, user_service } from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";
import db from "../models";

const {
  Album,
  MusicSinger,
  Song,
  SubscribedUsers,
  SunscriptionPlans,
  User,
}  = db;

async function getCount(req: Request, res: Response) {
  try {
    const count = await dashboard_service.count(
      req.body.filter_by,
      req.body.entity
    );
    return response_service.successResponse(
      res,
      req.body.entity + " count retrieved successfully.",
      { count }
    );
  } catch (err: any) {
    logger.error(`Error retrieving ${req.body.entity} count:`, err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getAllUsersList(req: Request, res: Response) {
  try {
    const users = await dashboard_service.getAllUsersList(
      req.body && req.body.is_singer && { is_singer: req.body.is_singer },
      req.body.page,
      req.body.limit,
      req.body.user_name,
      req.body.sort_by,
      req.body.sort_order
    );
    if (!users)
      return response_service.notFoundResponse(res, "No users found.");
    return response_service.successResponse(
      res,
      "Users list retrieved successfully.",
      users
    );
  } catch (error: any) {
    logger.error("Error getting all users list:", error);
    return response_service.internalServerErrorResponse(res, error.message);
  }
}

async function getUser(req: Request, res: Response) {
  try {
    const users = await user_service.getUser(
      { user_id: req.user.user_id || req.body.user_id },
      [
        {
          model: SubscribedUsers,
          as: "subscriptionPlan",
          required: false,
          where: {
            is_active: true,
          },
          include: [
            {
              model: SunscriptionPlans,
              as: "plan",
            },
          ],
        },
      ]
    );

    if (!users)
      return response_service.notFoundResponse(res, "No users found.");
    return response_service.successResponse(
      res,
      "Users list retrieved successfully.",
      users
    );
  } catch (error: any) {
    logger.error("Error getting all users list:", error);
    return response_service.internalServerErrorResponse(res, error.message);
  }
}
async function updateUserAdmin(req: Request, res: Response) {
  try {
    const users = await user_service.updateUser(req.body, {
      user_id: req.body.user_id,
    });
    if (!users)
      return response_service.notFoundResponse(res, "No users found.");
    return response_service.successResponse(
      res,
      "Users list retrieved successfully.",
      users
    );
  } catch (error: any) {
    logger.error("Error getting all users list:", error);
    return response_service.internalServerErrorResponse(res, error.message);
  }
}

async function usersByLogin(req: Request, res: Response) {
  try {
    const users = await dashboard_service.usersByLogin();
    if (!users)
      return response_service.notFoundResponse(
        res,
        "No users found for this login type."
      );
    return response_service.successResponse(
      res,
      "Users list retrieved successfully.",
      users
    );
  } catch (error: any) {
    logger.error("Error getting users by login type:", error);
    return response_service.internalServerErrorResponse(res, error.message);
  }
}

async function dashboardCountCards(req: Request, res: Response) {
  try {
    const count = await dashboard_service.dashboardCountCards(req.body.entity);
    return response_service.successResponse(
      res,
      req.body.entity + " count retrieved successfully.",
      { count }
    );
  } catch (err: any) {
    logger.error(`Error retrieving ${req.body.entity} count:`, err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getPlatformStatistics(req: Request, res: Response) {
  try {
    const statistics = await dashboard_service.getPlatformStatistics();

    return response_service.successResponse(
      res,
      "Dashboard statistics fetched successfully.",
      statistics
    );
  } catch (err: any) {
    logger.error("Error fetching dashboard statistics:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export {
  getCount,
  getAllUsersList,
  usersByLogin,
  getUser,
  updateUserAdmin,
  dashboardCountCards,
  getPlatformStatistics,
};
