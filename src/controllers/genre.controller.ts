import { genre_category_service, response_service } from "../services";

import { Request, Response } from "express";
import { logger } from "../utils";
import { config } from "../config";
import fs from "fs";

async function createGenre(req: Request, res: Response) {
  try {
    const genrePayload = req.body;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (files && files["genre_background_img"]) {
      genrePayload.background_img = files["genre_background_img"][0].path;
    }
    const genre = await genre_category_service.createGenre(genrePayload);
    console.log(genre);

    if (!genre)
      return response_service.badRequestResponse(
        res,
        "Failed to create genre."
      );
    return response_service.successResponse(
      res,
      "Genre created successfully.",
      genre
    );
  } catch (err: any) {
    logger.error("Error creating genre:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function updateGenre(req: Request, res: Response) {
  try {
    const genreId = parseInt(req.body.genre_id);
    const { genre_id, ...genrePayload } = req.body;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    let genre = await genre_category_service.getGenreById(genreId);
    if (!genre)
      return response_service.notFoundResponse(res, "Genre not found.");
    let del_genre_bg;
    if (files && files["genre_background_img"]) {
      genrePayload.background_img = files["genre_background_img"][0].path;
      del_genre_bg = genre.background_img;
    }
    genre = await genre_category_service.updateGenre(genreId, genrePayload);
    if (!genre)
      return response_service.notFoundResponse(res, "Genre not found.");
    if (del_genre_bg) {
      fs.existsSync(del_genre_bg.replace(config.clientUrl, "")) &&
        fs.unlinkSync(del_genre_bg.replace(config.clientUrl, ""));
    }
    return response_service.successResponse(
      res,
      "Genre updated successfully.",
      genre
    );
  } catch (err: any) {
    logger.error("Error updating genre:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function removeGenre(req: Request, res: Response) {
  try {
    const genreId = parseInt(req.body.genre_id);
    const result = await genre_category_service.removeGenre(genreId);
    if (result === 0)
      return response_service.notFoundResponse(
        res,
        "Genre not found or already deleted."
      );
    return response_service.successResponse(res, "Genre deleted successfully.");
  } catch (err: any) {
    logger.error("Error deleting genre:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getAllGenre(req: Request, res: Response) {
  try {
    const genreCategories = await genre_category_service.getAllGenres(
      req.body.page,
      req.body.limit,
      req.body.sort_by,
      req.body.sort_order,
      true
    );
    if (!genreCategories)
      return response_service.notFoundResponse(res, "Genre not found.");
    return response_service.successResponse(
      res,
      "Genre fetched successfully.",
      genreCategories
    );
  } catch (err: any) {
    logger.error("Error fetching genre:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getSongsByGenre(req: Request, res: Response) {
  try {
    const genreId = parseInt(req.body.genre_id);

    const songs = await genre_category_service.getSongsByGenre(
      genreId,
      req.body.page,
      req.body.limit,
      req.user?.user_id
    );
    if (!songs)
      return response_service.notFoundResponse(
        res,
        "Songs not found for this genre."
      );
    return response_service.successResponse(
      res,
      "Songs fetched successfully.",
      songs
    );
  } catch (err: any) {
    logger.error("Error fetching songs by genre:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getGenreAdmin(req: Request, res: Response) {
  try {
    const genreCategories = await genre_category_service.getAllGenres(
      req.body.page,
      req.body.limit,
      req.body.sort_by,
      req.body.sort_order,
      false
    );
    if (!genreCategories)
      return response_service.notFoundResponse(res, "Genre not found.");
    return response_service.successResponse(
      res,
      "Genre fetched successfully.",
      genreCategories
    );
  } catch (err: any) {
    logger.error("Error fetching genre:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export {
  createGenre,
  removeGenre,
  getAllGenre,
  getSongsByGenre,
  updateGenre,
  getGenreAdmin,
};
