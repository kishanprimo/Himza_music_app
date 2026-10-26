import {
  user_service,
  response_service,
  dashboard_service,
  singer_service,
} from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";
import { config } from "../config";
import fs from "fs";
import db from "../models";

const { Genre, singerGenre } = db;

async function createArtist(req: Request, res: Response) {
  try {
    const artistPayload = req.body;
    artistPayload.login_type = "email";
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    if (files?.["profile_pic"]) {
      artistPayload.profile_pic = files["profile_pic"][0].path;
    }

    let artist: any = await user_service.createUser({
      ...artistPayload,
      is_singer: true,
    });
    if (!artist)
      return response_service.badRequestResponse(
        res,
        "Failed to create artist."
      );
    if (artistPayload.genre_ids?.length > 0) {
      await Promise.all(
        artistPayload.genre_ids.map((genre_id: string) =>
          singer_service.addGenreToArtist(parseInt(genre_id), artist.user_id)
        )
      );
    }
    artist = await user_service.getUser({ user_id: artist.user_id }, [
      {
        model: singerGenre,
        as: "singerGenres",
        include: [
          {
            model: Genre,
            as: "genre",
          },
        ],
      },
    ]);

    return response_service.successResponse(
      res,
      "Artist created successfully.",
      artist
    );
  } catch (err: any) {
    logger.error("Error creating artist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function updateArtist(req: Request, res: Response) {
  try {
    const artistId = req.body.user_id;
    const artistPayload = req.body;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    let artist = await user_service.getUser({
      user_id: artistId,
      // is_singer: true,
      is_deleted: false,
    });
    let del_profile_pic;
    if (files && files["profile_pic"]) {
      artistPayload.profile_pic = files["profile_pic"][0].path;
      del_profile_pic = artist?.profile_pic;
    }
    artist = await user_service.updateUser(
      { ...artistPayload },
      { user_id: artistId, is_deleted: false }
    );
    if (!artist)
      return response_service.badRequestResponse(res, "Artist not found.");
    if (del_profile_pic && !del_profile_pic?.includes("default_profile_pics")) {
      const pic = del_profile_pic.replace(config.clientUrl, "");
      fs.existsSync(pic) && fs.unlinkSync(pic);
    }
    return response_service.successResponse(
      res,
      "User updated successfully.",
      artist
    );
  } catch (err: any) {
    logger.error("Error updating artist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function deleteArtist(req: Request, res: Response) {
  try {
    const artistId = req.body.user_id;

    const artist = await user_service.updateUser(
      { is_deleted: true },
      {
        user_id: artistId,
        is_singer: true,
      }
    );

    if (!artist) {
      return response_service.badRequestResponse(
        res,
        "Artist not found."
      );
    }

    return response_service.successResponse(
      res,
      "Artist deleted successfully.",
      artist
    );
  } catch (err: any) {
    logger.error("Error deleting artist:", err);
    return response_service.internalServerErrorResponse(
      res,
      err.message
    );
  }
}

async function getArtists(req: Request, res: Response) {
  try {
    const artist = await dashboard_service.getAllUsersList(
      { is_singer: true },
      req.body.page,
      req.body.limit,
      req.body.user_name,
      req.body.sort_by,
      req.body.sort_order
    );
    if (!artist)
      return response_service.notFoundResponse(res, "Artist not found.");
    return response_service.successResponse(
      res,
      "Artist fetched successfully.",
      artist
    );
  } catch (err: any) {
    logger.error("Error fetching artist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getArtist(req: Request, res: Response) {
  try {
    const artist_id = req.body.artist_id;

    const artist = await user_service.getArtist(artist_id);

    if (!artist)
      return response_service.notFoundResponse(res, "Artist not found.");

    return response_service.successResponse(
      res,
      "Artist with songs retrieved successfully.",
      artist
    );
  } catch (error: any) {
    logger.error("Error getting artist songs:", error);
    return response_service.internalServerErrorResponse(res, error.message);
  }
}

export { createArtist, updateArtist, deleteArtist, getArtists, getArtist };
