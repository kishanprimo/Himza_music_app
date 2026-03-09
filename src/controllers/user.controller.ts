import { user_service, response_service, history_service } from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";
import removeExtraFields from "../services/common/removeExtraFields.service";
import * as fs from "fs";
import { getAvatar } from "../services/avatar.service";
import { config } from "../config";
import db from "../models";

const { Album, MusicSinger, song, SubscribedUsers, SunscriptionPlans, User } =
  db;

  // get user ====================================================
async function getUser(req: Request, res: Response) {
console.info("user id profile",req.user.user_id)

  try {
    const user = await user_service.getUser(
      { user_id: req.user.user_id || req.body.user_id },
      [
        {
          model: song,
          as: "currentSong",
          include: [
            {
              model: MusicSinger,
              as: "artists",
              attributes: ["music_singer_id"],
              include: [
                {
                  model: User,
                  as: "singer",
                  attributes: ["user_id", "full_name", "profile_pic"],
                },
              ],
            },
          ],
        },
        { model: Album, as: "currentAlbum" },
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
  order: [["createdAt", "DESC"]], // latest first
  limit: 1, // sirf last plan
},
      ]
    );
  console.info("user @q3234",user)


    if (!user) return response_service.notFoundResponse(res, "User not found.");
    return response_service.successResponse(
      res,
      "User retrieved successfully.",
      removeExtraFields(user, [
        "otp",
        "login_verification_status",
        "login_type",
        "is_admin",
        "device_token",
      ])
    );
  } catch (err: any) {
    logger.error("Error retrieving user:", err);
    console.error("Error in getting user deatil")
    return response_service.internalServerErrorResponse(res, err.message);
  }
}


/**
 * Updates the user information.
 * @param req - The request object containing user data to update.
 * @param res - The response object to send the result.
 * @returns A success response with updated user data or an error response.
 */
// update user ==========================================
async function updateUser(req: Request, res: Response) {
  try {
    const userId = req.user.user_id || req.user.user_id;
    if (!userId) {
  return response_service.badRequestResponse(res, "Invalid user");
}
    console.log(userId, "=---------------");
    let user = await user_service.getUser({ user_id: userId });

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    if (files?.["profile_pic"]) {
      req.body.profile_pic = files["profile_pic"][0].path;
      if (
        user?.profile_pic &&
        !user?.profile_pic?.includes("default_profile_pics")
      ) {
        const pic = user.profile_pic.replace(config.clientUrl, "");
        fs.existsSync(pic) && fs.unlinkSync(pic);
      }
    } else if (req.body && req.body.avatar_id) {
      const avatar = await getAvatar(req.body.avatar_id);
      req.body.profile_pic = avatar?.path.replace(config.clientUrl, "");
      if (
        user?.profile_pic &&
        !user?.profile_pic?.includes("default_profile_pics")
      ) {
        const pic = user.profile_pic.replace(config.clientUrl, "");
        fs.existsSync(pic) && fs.unlinkSync(pic);
      }
    }
    // delete req.body.user_id;
    user = await user_service.updateUser(req.body, { user_id: userId });
    user = await user_service.getUser({ user_id: userId }, [
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
    ]);
    return response_service.successResponse(
      res,
      "User updated successfully.",
      removeExtraFields(user, [
        "otp",
        "login_verification_status",
        "login_type",
        "is_admin",
        "device_token",
      ])
    );
  } catch (err: any) {
    logger.error("Error updating user:", err);

    // Handle duplicate field errors
    if (err.parent?.code === "23505") {
      // PostgreSQL unique violation error code
      const detail = err.parent?.detail || "";
      let field = "field";
      let value = "";

      // Extract field name from error detail (e.g., "Key (email)=(test@example.com) already exists")
      const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
      if (match) {
        field = match[1];
        value = match[2];
        return response_service.conflictResponse(
          res,
          `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use.`
        );
      }

      return response_service.conflictResponse(
        res,
        "This value is already in use"
      );
    }

    // For other errors, return a generic error message
    logger.error("Error updating user:", err);
    return response_service.internalServerErrorResponse(
      res,
      "An error occurred while updating your profile. Please try again."
    );
  }
}

// update current song ======================================================
async function updateCurrentsong(req: Request, res: Response) {
  try {
    const user = await user_service.updateUser(
      {
        current_song_id: req.body.current_song_id,
        current_album_id: req.body.current_album_id,
        current_song_time: req.body.current_song_time,
      },
      { user_id: req.user.user_id }
    );
    if (!user) return response_service.notFoundResponse(res, "User not found.");
    if (!user.current_song_id) {
      return response_service.badRequestResponse(
        res,
        "Current song is not set."
      );
    }
    await history_service.addToHistory(
      parseInt(user.current_song_id),
      parseInt(user.user_id),
      user.current_album_id ? parseInt(user.current_album_id) : null,
      user.current_song_time
    );
    const data = await history_service.getUserHistory(req.user.user_id, 1, 1);
    return response_service.successResponse(
      res,
      "Current song updated successfully.",
      removeExtraFields(data?.data[0], [
        "otp",
        "login_verification_status",
        "login_type",
        "is_admin",
        "device_token",
      ])
    );
  } catch (err: any) {
    logger.error("Error updating current song:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// update song time ================================================
async function updateSongTime(req: Request, res: Response) {
  try {
    const user = await user_service.updateUser(
      { current_song_time: req.body.current_song_time },
      { user_id: req.user.user_id }
    );
    if (!user) return response_service.notFoundResponse(res, "User not found.");
    if (!user.current_song_time) {
      return response_service.badRequestResponse(
        res,
        "Current song is not set."
      );
    }
    const data = await history_service.updateHistoryTime(
      req.body.history_id,
      user.current_song_time
    );
    return response_service.successResponse(
      res,
      "Current song time updated successfully.",
      removeExtraFields(data, [
        "otp",
        "login_verification_status",
        "login_type",
        "is_admin",
        "device_token",
      ])
    );
  } catch (err: any) {
    logger.error("Error updating current song time:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// 
async function userHistory(req: Request, res: Response) {
  try {
    const history = await history_service.getUserHistory(
      req.user.user_id,
      req.body.page,
      req.body.limit
    );
    if (!history)
      return response_service.notFoundResponse(
        res,
        "No history found for this user."
      );
    return response_service.successResponse(
      res,
      "User history retrieved successfully.",
      history
    );
  } catch (err: any) {
    logger.error("Error retrieving user history:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function validateUsername(req: Request, res: Response) {
  try {
    const user = await user_service.getUser({ username: req.body.username });
    if (user) {
      return response_service.successResponse(res, "Username already exists.", {
        is_available: false,
      });
    } else {
      return response_service.successResponse(res, "Username is available.", {
        is_available: true,
      });
    }
  } catch (error: any) {
    logger.error("Error validating username:", error);
    return response_service.internalServerErrorResponse(res, error.message);
  }
}

async function deleteUser(req: Request, res: Response) {
  try {
    const user = await user_service.deleteUser({ user_id: req.user.user_id });
    if (!user) return response_service.notFoundResponse(res, "User not found.");
    return response_service.successResponse(res, "User deleted successfully.");
  } catch (err: any) {
    logger.error("Error deleting user:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// to get subscription plans of particular user =================================
async function getUserSubscriptions(req: Request, res: Response) {
  try {
    const subscriptions = await user_service.getUserSubscriptions(
      req.user.user_id,
      req.body.page,
      req.body.limit
    );
    if (!subscriptions)
      return response_service.notFoundResponse(res, "User not found.");
    return response_service.successResponse(
      res,
      "User subscriptions retrieved successfully.",
      subscriptions
    );
  } catch (err: any) {
    logger.error("Error retrieving user subscriptions:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export {
  getUser,
  updateUser,
  updateCurrentsong,
  userHistory,
  updateSongTime,
  validateUsername,
  deleteUser,
  getUserSubscriptions,
};
