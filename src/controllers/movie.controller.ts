import db from "../models";

const { MovieSongConnection, Song } = db;
import { config } from "../config";
import { movie_service, response_service } from "../services";
import { logger } from "../utils";
import { Request, Response } from "express";
import fs from "fs";

export async function createMovie(req: Request, res: Response) {
  try {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    if (!files || !files["poster"]) {
      return response_service.badRequestResponse(res, "Upload poster.");
    }
    const poster = files["poster"][0].path;

    const movie = await movie_service.createMovie({ ...req.body, poster });

    if (!movie)
      return response_service.badRequestResponse(
        res,
        "Failed to create movie."
      );

    return response_service.successResponse(
      res,
      "Movie created successfully.",
      movie
    );
  } catch (err: any) {
    logger.error("Error creating movie:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function getAllMovies(req: Request, res: Response) {
  try {
    const movies = await movie_service.getAllMovies(
      req.body.page,
      req.body.limit,
      [
        {
          model: MovieSongConnection,
          as: "songs",
          include: [{ model: Song, as: "song_details" }],
        },
      ]
    );
    if (!movies || movies.total === 0) {
      return response_service.notFoundResponse(res, "No movies found.");
    }
    return response_service.successResponse(
      res,
      "Movies retrieved successfully.",
      movies
    );
  } catch (err: any) {
    logger.error("Error retrieving movies:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function getMovieById(req: Request, res: Response) {
  try {
    const movie = await movie_service.getMovie(parseInt(req.body.movie_id), [
      {
        model: MovieSongConnection,
        as: "songs",
        include: [
          {
            model: Song,
            as: "song_details",
          },
        ],
      },
    ]);
    if (!movie) {
      return response_service.notFoundResponse(res, "Movie not found.");
    }
    return response_service.successResponse(
      res,
      "Movie retrieved successfully.",
      { movie }
    );
  } catch (err: any) {
    logger.error("Error retrieving movie:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function updateMovie(req: Request, res: Response) {
  try {
    let movie = await movie_service.getMovie(parseInt(req.body.movie_id));
    if (!movie) {
      return response_service.notFoundResponse(res, "Movie not found.");
    }
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    let poster;
    let movie_data = { ...req.body };
    if (files?.["poster"]) {
      poster = movie.poster;
      movie_data = { ...movie_data, poster: files?.["poster"]?.[0].path };
    } else {
      movie_data = { ...movie_data };
    }
    movie = await movie_service.updateMovie(
      parseInt(req.body.movie_id),
      movie_data
    );
    if (!movie) {
      return response_service.badRequestResponse(
        res,
        "Failed to update movie."
      );
    }
    if (poster) {
      fs.existsSync(poster.replace(config.clientUrl, "")) &&
        fs.unlinkSync(poster.replace(config.clientUrl, ""));
    }
    return response_service.successResponse(
      res,
      "Movie updated successfully.",
      { movie }
    );
  } catch (err: any) {
    logger.error("Error updating movie:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function deleteMovie(req: Request, res: Response) {
  try {
    const movie = await movie_service.deleteMovie(parseInt(req.body.movie_id));
    if (!movie) {
      return response_service.notFoundResponse(res, "Movie not found.");
    }
    return response_service.successResponse(
      res,
      "Movie deleted successfully.",
      { movie }
    );
  } catch (err: any) {
    logger.error("Error deleting movie:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function addSongsToMovie(req: Request, res: Response) {
  try {
    const { songIds } = req.body;
    // Assuming songIsInMovie is an async function or a function you have access to
    let song_ids: string[] = [];
    for (const songId of songIds) {
      if (await movie_service.songIsInAnyMovie(parseInt(songId))) {
        continue;
      }
      song_ids.push(songId);
    }
    if (song_ids.length === 0) {
      return response_service.badRequestResponse(
        res,
        "Songs are already in a movie."
      );
    }
    const movie = await movie_service.addSongsToMovie(
      song_ids,
      parseInt(req.body.movie_id)
    );
    if (!movie) {
      return response_service.notFoundResponse(res, "Movie not found.");
    }
    return response_service.successResponse(
      res,
      "Songs added to movie successfully.",
      await movie_service.getMovie(parseInt(req.body.movie_id), [
        {
          model: MovieSongConnection,
          as: "songs",
          include: [
            {
              model: Song,
              as: "song_details",
            },
          ],
        },
      ])
    );
  } catch (err: any) {
    logger.error("Error adding songs to movie:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function removeSongsFromMovie(req: Request, res: Response) {
  try {
    const { songIds } = req.body;
    const movie = await movie_service.removeSongsFromMovie(
      songIds,
      parseInt(req.body.movie_id)
    );
    if (!movie) {
      return response_service.notFoundResponse(res, "Movie not found.");
    }
    return response_service.successResponse(
      res,
      "Songs removed from movie successfully.",
      await movie_service.getMovie(parseInt(req.body.movie_id), [
        {
          model: MovieSongConnection,
          as: "songs",
          include: [
            {
              model: Song,
              as: "song_details",
            },
          ],
        },
      ])
    );
  } catch (err: any) {
    logger.error("Error removing songs from movie:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}
