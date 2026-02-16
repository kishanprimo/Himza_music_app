import { response_service, singer_service } from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";

async function getFavoriteArtists(req: Request, res: Response) {
  try {
    const artists = await singer_service.getFavoriteArtists(
      req.user.user_id,
      req.body.page,
      req.body.limit
    );
    if (!artists)
      return response_service.notFoundResponse(res, "Artists not found.");
    return response_service.successResponse(
      res,
      "Artists fetched successfully.",
      artists
    );
  } catch (err: any) {
    logger.error("Error fetching artists:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// search favorite artist
async function searchFavoriteArtists(req: Request, res: Response) {
  console.log(req.body); // shows page & limit here

  try {
    const page =
      req.body.page && !isNaN(Number(req.body.page))
        ? Number(req.body.page)
        : 1;

    const limit =
      req.body.limit && !isNaN(Number(req.body.limit))
        ? Number(req.body.limit)
        : 10;

    const result = await singer_service.searchFavoriteArtists(
      req.user.user_id,
      req.body.search,
      page,
      limit
    );

    if (!result)
      return response_service.notFoundResponse(res, "Artists not found.");

    return response_service.successResponse(
      res,
      "Artists fetched successfully.",
      result
    );
  } catch (err: any) {
    logger.error("Error fetching artists:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}



async function setfavorite(req: Request, res: Response) {
  try {
    const user = req.user;
    const artistId = req.body.artist_id;
    const isfavorite = await singer_service.setfavorite(user.user_id, artistId);
    return response_service.successResponse(
      res,
      `Artist marked as favorite: ${isfavorite}.`
    );
  } catch (err: any) {
    logger.error("Error setting favorite:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function isfavorite(req: Request, res: Response) {
  try {
    const user = req.user;
    const artistId = req.body.artist_id;
    const isfavorite = await singer_service.isfavorite(user.user_id, artistId);
    return response_service.successResponse(
      res,
      `Artist is favorite: ${isfavorite}.`
    );
  } catch (err: any) {
    logger.error("Error checking favorite:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export { getFavoriteArtists, searchFavoriteArtists, setfavorite, isfavorite };
