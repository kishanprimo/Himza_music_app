import { ad_service, response_service } from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { config } from "../config";
import fs from "fs";
import { getVideoDurationInSeconds } from "get-video-duration";

// get all ads for admin ====================================
async function getAdsForAdmin(req: Request, res: Response) {
  try {
    const ads = await ad_service.getAdsForAdmin({
      payload: { type: req.body.type },
      page: req.body.page,
      limit: req.body.limit,
      search_by: req.body.search_by,
      search_order: req.body.search_order,
      search_term: req.body.search_term,
    });
    if (!ads) return response_service.notFoundResponse(res, "Ads not found.");
    return response_service.successResponse(
      res,
      "Ads fetched successfully.",
      ads
    );
  } catch (err: any) {
    logger.error("Error fetching ads:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get ads for user ======================================================
async function getAds(req: Request, res: Response) {
  try {
    const ads = await ad_service.getAds();
    if (!ads) return response_service.notFoundResponse(res, "Ads not found.");
    return response_service.successResponse(
      res,
      "Ads fetched successfully.",
      ads
    );
  } catch (err: any) {
    logger.error("Error fetching ads:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// create Add =============================================
async function createAd(req: Request, res: Response) {
  try {
    const admin = req.user;
    if (!admin.admin_id)
      return response_service.badRequestResponse(
        res,
        "Only admins can create ads."
      );
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    if (files && files["ad_banner"]) {
      req.body.banner = files["ad_banner"][0].path;
    }
    // if (req.body.type == "video" || req.body.type == "in-song") {
    //   if (files && files["ad_video"]) {
    //     req.body.video = files["ad_video"][0].path;

    //   } else {
    //     return response_service.badRequestResponse(
    //       res,
    //       "Video is required for video ads."
    //     );
    //   }

    //   // if (files && files["ad_audio"]) {
    //   //   req.body.audio = files["ad_audio"][0].path;
    //   // } else {
    //   //   return response_service.badRequestResponse(
    //   //     res,
    //   //     "Audio is required for video ads."
    //   //   );
    //   // }
    // }

    if (req.body.type === "video" || req.body.type === "in-song") {
      if (files && files["ad_video"]) {
        const videoPath = files["ad_video"][0].path;

        // get the duration of video , allow 30 seconds video only
        const duration = await getVideoDurationInSeconds(videoPath);

        if (duration > 30) {
          fs.unlinkSync(videoPath); // delete file

          return response_service.badRequestResponse(
            res,
            "Video must be 30 seconds or less."
          );
        }
        // add path if proper
        req.body.video = videoPath;
      } else {
        return response_service.badRequestResponse(
          res,
          "Video is required for video ads."
        );
      }
    }

    // req.body.start_date = dayjs(req.body.start_date).format("YYYY-MM-DD");
    // req.body.end_date = dayjs(req.body.end_date).format("YYYY-MM-DD");
    if (req.body.type == "banner") {
      const exising_ad = await ad_service.getAds({
        placement: req.body.placement,
        position: req.body.position,
        type: req.body.type,
      });
      if (exising_ad.length > 0)
        return response_service.badRequestResponse(
          res,
          "Ad already exists for this placement."
        );
    }
    const ad = await ad_service.createAd(req.body);
    if (!ad)
      return response_service.badRequestResponse(res, "Failed to create ad.");
    return response_service.successResponse(
      res,
      "Ad created successfully.",
      ad
    );
  } catch (err: any) {
    logger.error("Error creating ad:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// Update add ==========================================================
async function updateAd(req: Request, res: Response) {
  try {
    const admin = req.user;
    if (!admin.admin_id)
      return response_service.badRequestResponse(
        res,
        "Only admins can update ads."
      );
    if (req.body.start_date)
      req.body.start_date = dayjs(req.body.start_date).format("YYYY-MM-DD");
    if (req.body.end_date)
      req.body.end_date = dayjs(req.body.end_date).format("YYYY-MM-DD");
    if (req.files) {
      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      if (files && files["ad_banner"]) {
        req.body.banner = files["ad_banner"][0].path;
        const ad = await ad_service.getAds({ ad_id: req.body.ad_id });
        if (ad.length != 1)
          return response_service.notFoundResponse(res, "Ad not found.");
        if (ad[0].banner) {
          const del_banner = ad[0].banner.replace(config.clientUrl, "");
          if (fs.existsSync(del_banner)) {
            fs.unlinkSync(del_banner);
          }
        }
      }
      if (files && files["ad_video"]) {
        req.body.video = files["ad_video"][0].path;
        const ad = await ad_service.getAds({ ad_id: req.body.ad_id });
        if (ad.length != 1)
          return response_service.notFoundResponse(res, "Ad not found.");
        if (ad[0].video) {
          const del_video = ad[0].video.replace(config.clientUrl, "");
          if (fs.existsSync(del_video)) {
            fs.unlinkSync(del_video);
          }
        }
      }
      if (files && files["ad_audio"]) {
        req.body.audio = files["ad_audio"][0].path;
        const ad = await ad_service.getAds({ ad_id: req.body.ad_id });
        if (ad.length != 1)
          return response_service.notFoundResponse(res, "Ad not found.");
        if (ad[0].audio) {
          const del_audio = ad[0].audio.replace(config.clientUrl, "");
          if (fs.existsSync(del_audio)) {
            fs.unlinkSync(del_audio);
          }
        }
      }
    }
    const ad = await ad_service.updateAd(req.body, { ad_id: req.body.ad_id });
    if (!ad)
      return response_service.badRequestResponse(res, "Failed to update ad.");
    return response_service.successResponse(
      res,
      "Ad updated successfully.",
      ad
    );
  } catch (err: any) {
    logger.error("Error updating ad:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// delete ad =================================================
async function deleteAd(req: Request, res: Response) {
  try {
    const ad = await ad_service.deleteAd({ ad_id: req.body.ad_id });
    if (!ad)
      return response_service.badRequestResponse(res, "Failed to delete ad.");
    return response_service.successResponse(
      res,
      "Ad deleted successfully.",
      ad
    );
  } catch (err: any) {
    logger.error("Error deleting ad:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get ads for album ===================================================
async function getAdsForAlbum(req: Request, res: Response) {
  try {
    const ads = await ad_service.getAds({
      album_ids: { [Op.contains]: [req.body.album_id] },
      placement: { [Op.in]: ["Album"] },
    });
    if (!ads) return response_service.notFoundResponse(res, "Ads not found.");
    return response_service.successResponse(
      res,
      "Ads fetched successfully.",
      ads
    );
  } catch (err: any) {
    logger.error("Error fetching ads:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get ads for home ====================================================
async function getAdsForHome(req: Request, res: Response) {
  try {
    const ads = await ad_service.getAds({
      placement: { [Op.in]: ["Home"] },
    });
    if (!ads) return response_service.notFoundResponse(res, "Ads not found.");
    return response_service.successResponse(
      res,
      "Ads fetched successfully.",
      ads
    );
  } catch (err: any) {
    logger.error("Error fetching ads:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// add albums to ad =============================================
async function addAlbumsToAd(req: Request, res: Response) {
  try {
    const admin = req.user;
    if (!admin.admin_id)
      return response_service.badRequestResponse(
        res,
        "Only admins can add albums to ad."
      );
    let ad = await ad_service.getAds({ ad_id: req.body.ad_id });
    if (ad.length != 1)
      return response_service.notFoundResponse(res, "Ad not found.");
    if (ad[0].placement != "album" && ad[0].placement != "home-album")
      return response_service.badRequestResponse(
        res,
        "Cannot add albums to this ad."
      );
    if (ad[0].album_ids.includes(parseInt(req.body.album_id)))
      return response_service.badRequestResponse(
        res,
        "Album already added to ad."
      );
    const updated_ad = await ad_service.addAlbumsToAd(
      req.body.ad_id,
      req.body.album_id
    );
    if (!ad)
      return response_service.badRequestResponse(
        res,
        "Failed to add albums to ad."
      );
    return response_service.successResponse(
      res,
      "Albums added to ad successfully.",
      updated_ad
    );
  } catch (err: any) {
    logger.error("Error adding albums to ad:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// remove albums from ad =================================================
async function removeAlbumsFromAd(req: Request, res: Response) {
  try {
    const admin = req.user;
    if (!admin.admin_id)
      return response_service.badRequestResponse(
        res,
        "Only admins can remove albums from ad."
      );
    let ad = await ad_service.getAds({ ad_id: req.body.ad_id });
    if (ad.length != 1)
      return response_service.notFoundResponse(res, "Ad not found.");
    if (ad[0].placement != "album" && ad[0].placement != "home-album")
      return response_service.badRequestResponse(
        res,
        "Cannot remove albums from this ad."
      );
    if (!ad[0].album_ids.includes(parseInt(req.body.album_id)))
      return response_service.badRequestResponse(res, "Album not added to ad.");

    const updated_ad = await ad_service.removeAlbumsFromAd(
      req.body.ad_id,
      req.body.album_id
    );
    if (!ad)
      return response_service.badRequestResponse(
        res,
        "Failed to remove albums from ad."
      );
    return response_service.successResponse(
      res,
      "Albums removed from ad successfully.",
      updated_ad
    );
  } catch (err: any) {
    logger.error("Error removing albums from ad:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getAdsForAlbum,
  getAdsForHome,
  addAlbumsToAd,
  removeAlbumsFromAd,
  getAdsForAdmin,
};
