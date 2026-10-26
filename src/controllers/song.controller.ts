import {
  response_service,
  singer_service,
  song_service,
  user_service,
} from "../services";
import { getAudioDuration } from "../utils/audioDuration";
import removeExtraFields from "../services/common/removeExtraFields.service";
import { Request, Response } from "express";
import { logger } from "../utils";
import { config } from "../config";
import fs from "fs";
import db from "../models";
import { Op, fn, col } from "sequelize";
// import Downloads from "../models/downloads";

const {
  Genre,
  Movie,
  MovieSongConnection,
  MusicSinger,
  favoriteArtists,
  favorites,
  Downloads,
} = db;

async function getSong(req: Request, res: Response) {
  try {
    const song = await song_service.getSong(parseInt(req.body.song_id), [
      {
        model: Genre,
        as: "genre",
      },
      {
        model: MusicSinger,
        as: "artists",
      },
      {
        model: MovieSongConnection,
        as: "movie",
        include: [
          {
            model: Movie,
            as: "movie_details",
          },
        ],
      },
    ]);
    if (!song) return response_service.notFoundResponse(res, "Song not found.");
    const is_favorite = await song_service.isfavorite(
      req.user?.user_id,
      parseInt(req.body.song_id),
    );
    const is_downloaded = req.user?.user_id
      ? await song_service.isDownloaded(
        req.user.user_id,
        parseInt(req.body.song_id),
      )
      : false;

    // get downloads details
    return response_service.successResponse(res, "Song fetched successfully.", {
      ...song,
      is_favorite,
      is_downloaded,
    });
  } catch (err: any) {
    logger.error("Error fetching song:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function setfavorite(req: Request, res: Response) {
  try {
    const user = req.user;
    const songId = parseInt(req.body.song_id);
    const song = await song_service.getSong(songId);
    if (!song) return response_service.notFoundResponse(res, "Song not found.");
    const isfavorite = await song_service.setfavorite(user.user_id, songId);
    return response_service.successResponse(
      res,
      `Song marked as favorite: ${isfavorite}.`,
    );
  } catch (err: any) {
    logger.error("Error setting favorite:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function setDownloaded(req: Request, res: Response) {
  try {
    const user = req.user;
    const songId = parseInt(req.body.song_id);
    const song = await song_service.getSong(songId);
    if (!song) return response_service.notFoundResponse(res, "Song not found.");
    await song_service.setDownloaded(user.user_id, songId);
    return response_service.successResponse(
      res,
      `Song marked as downloaded: true.`,
    );
  } catch (err: any) {
    logger.error("Error setting downloaded:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getMySongs(req: Request, res: Response) {
  try {
    const artistId = Number(req.body.artist_id);
    const page = Math.max(1, parseInt(req.body.page) || 1);
    const limit = Math.max(1, parseInt(req.body.limit) || 10);
    const currentUserId = req.user?.user_id;

    const artist = await user_service.getUser(
      { user_id: String(artistId), is_singer: true },
      [],
      ["user_id", "full_name", "profile_pic"],
    );
    if (!artist) {
      return response_service.notFoundResponse(
        res,
        "Artist not found.",
      );
    }

    let is_favorite = false;
    let artist_favorite = false;

    if (currentUserId) {
      is_favorite = await singer_service.isfavorite(
        currentUserId,
        artistId,
      );

      const fav = await favoriteArtists.findOne({
        where: {
          user_id: currentUserId,
          artist_user_id: artistId,
        },
        attributes: ["artist_user_id"],
      });

      artist_favorite = !!fav;
    }

    const [songs_count, likes_count, songs] = await Promise.all([
      singer_service.mySongsCount(artistId),

      favoriteArtists.count({
        where: { artist_user_id: artistId },
      }),

      singer_service.mySongs(artistId, page, limit),
    ]);

    const songIds = songs.data.map((item: any) => item.song_id);

    let userFavorites: any[] = [];
    let userDownloads: any[] = [];
    let songLikes: any[] = [];

    if (songIds.length > 0) {
      [userFavorites, userDownloads, songLikes] = await Promise.all([
        currentUserId
          ? favorites.findAll({
            where: {
              user_id: currentUserId,
              song_id: { [Op.in]: songIds },
            },
            attributes: ["song_id"],
            raw: true,
          })
          : Promise.resolve([]),

        currentUserId
          ? Downloads.findAll({
            where: {
              user_id: currentUserId,
              song_id: { [Op.in]: songIds },
            },
            attributes: ["song_id"],
            raw: true,
          })
          : Promise.resolve([]),

        favorites.findAll({
          where: {
            song_id: { [Op.in]: songIds },
          },
          attributes: [
            "song_id",
            [fn("COUNT", col("song_id")), "total"],
          ],
          group: ["song_id"],
          raw: true,
        }),
      ]);
    }

    const favoriteSongIds = new Set(
      userFavorites.map((item: any) => Number(item.song_id)),
    );

    const downloadedSongIds = new Set(
      userDownloads.map((item: any) => Number(item.song_id)),
    );

    const songLikesMap = new Map<number, number>(
      songLikes.map((item: any) => [
        Number(item.song_id),
        Number(item.total),
      ]),
    );

    const formattedSongs = songs.data.map((song: any) => {
      const { singer, ...rest } = song;
      const songId = Number(song.song_id);

      return {
        ...rest,
        singer: {
          ...singer,
          is_favorite,
          songs_count,
          likes_count,
        },
        artist_favorite,
        is_favorite: currentUserId
          ? favoriteSongIds.has(songId)
          : false,
        is_downloaded: currentUserId
          ? downloadedSongIds.has(songId)
          : false,
        likes_count: songLikesMap.get(songId) ?? 0,
      };
    });

    return response_service.successResponse(
      res,
      "Songs fetched successfully.",
      {
        artist_favorite,
        pagination: {
          total: songs.total,
          page: songs.page,
          pageSize: songs.pageSize,
          totalPages: songs.totalPages,
        },
        data: formattedSongs,
      },
    );
  } catch (err: any) {
    logger.error("Error fetching songs:", err);

    return response_service.internalServerErrorResponse(
      res,
      err.message,
    );
  }
}


async function createMusic(req: Request, res: Response) {
  try {
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (!files || !files["thumbnail"] || !files["audio"]) {
      return response_service.badRequestResponse(
        res,
        "Audio and thumbnail are required.",
      );
    }

    const audio = files["audio"][0];
    const thumbnail = files["thumbnail"][0];

    if (!audio || !thumbnail) {
      return response_service.badRequestResponse(
        res,
        "Audio and thumbnail are required.",
      );
    }

    const duration = await getAudioDuration(audio.path);

    // 1. Create song
    const song = await singer_service.addSong({
      category_id: req.body.category_id,
      genre_id: req.body.genre_id,
      audio: audio.path.replace(/\\/g, "/"),
      thumbnail: thumbnail.path.replace(/\\/g, "/"),
      title: req.body.title,
      duration: duration.toString(),
    });

    if (!song) {
      return response_service.badRequestResponse(
        res,
        "Failed to add song.",
      );
    }

    // 2. Get artist IDs
    const artistIds = Array.isArray(req.body.artist_ids)
      ? req.body.artist_ids
      : req.body.artist_ids
        ? [req.body.artist_ids]
        : [];

    // 3. Add artists to music_singers
    for (const artistId of artistIds) {
      const singerId = Number(artistId);

      if (!singerId) continue;

      const isSinger = await singer_service.isSinger(singerId);

      if (isSinger) {
        await singer_service.addSongToArtist(
            Number(song.song_id),
            singerId,
          );
      }
    }

    return response_service.successResponse(
      res,
      "Music added successfully.",
      removeExtraFields(song, ["genre_id"]),
    );

  } catch (err: any) {
    logger.error("Error adding song:", err);

    return response_service.internalServerErrorResponse(
      res,
      err.message,
    );
  }
}

async function updateSong(req: Request, res: Response) {
  try {
    const songId = parseInt(req.body.song_id);
    const song = await song_service.getSong(songId);
    if (!song) return response_service.notFoundResponse(res, "Song not found.");

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    let updatedData: any = { ...req.body };


    if (files && files["audio"]) {
      updatedData.audio = files["audio"][0].path;
      const duration = await getAudioDuration(updatedData.audio);
      updatedData.duration = duration.toString();
      if (song.audio) {
        fs.existsSync(song.audio.replace(config.clientUrl, "")) &&
          fs.unlinkSync(song.audio.replace(config.clientUrl, ""));
      }
    }

    if (files && files["thumbnail"]) {
      updatedData.thumbnail = files["thumbnail"][0].path;
      if (song.thumbnail) {
        fs.existsSync(song.thumbnail.replace(config.clientUrl, "")) &&
          fs.unlinkSync(song.thumbnail.replace(config.clientUrl, ""));
      }
    }

    const updatedSong = await song_service.updateSong(songId, updatedData);

    if (updatedSong && updatedData.artist_ids) {
      // Remove old artist mappings
      await singer_service.removeSongArtists(songId);

      // Add new artist mappings
      for (const artist_id of updatedData.artist_ids) {
        const is_singer = await singer_service.isSinger(parseInt(artist_id));

        if (is_singer) {
          await singer_service.addSongToArtist(
            songId,
            parseInt(artist_id)
          );
        }
      }
    }
    if (updatedSong) {
      return response_service.successResponse(
        res,
        "Song updated successfully.",
        updatedSong,
      );
    }
    return response_service.badRequestResponse(res, "Failed to update song.");
  } catch (err: any) {
    logger.error("Error updating song:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getNextSong(req: Request, res: Response) {
  try {
    const song_ids = await song_service.getTotalSongs();
    let song_id = song_ids[Math.floor(Math.random() * song_ids.length)];
    const song = await song_service.getSong(parseInt(song_id));
    if (!song) return response_service.notFoundResponse(res, "Song not found.");
    const is_favorite = await song_service.isfavorite(
      parseInt(song_id),
      req.user?.user_id,
    );
    return response_service.successResponse(res, "Song fetched successfully.", {
      ...song,
      is_favorite,
    });
  } catch (err: any) {
    logger.error("Error fetching next song:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getfavoriteSongs(req: Request, res: Response) {
  try {
    const songs = await song_service.getfavoriteSongs(
      req.user.user_id || req.body.user_id,
      req.body.page,
      req.body.limit,
    );
    if (!songs)
      return response_service.notFoundResponse(res, "Songs not found.");
    return response_service.successResponse(
      res,
      "Songs fetched successfully.",
      songs,
    );
  } catch (err: any) {
    logger.error("Error fetching favorite songs:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// search for favorite songs ========================================
async function searchFavoriteSongs(req: Request, res: Response) {
  try {
    const user = req.user as any;

    const search = String(req.body.search || "").trim();

    const page =
      req.body.page !== undefined && req.body.page !== ""
        ? Number(req.body.page)
        : 1;

    const limit =
      req.body.limit !== undefined && req.body.limit !== ""
        ? Number(req.body.limit)
        : 10;

    if (!search) {
      return response_service.badRequestResponse(
        res,
        "Search keyword is required."
      );
    }

    const result = await song_service.searchFavoriteSongs(
      user.user_id,
      search,
      page,
      limit
    );

    return response_service.successResponse(
      res,
      "Favorite songs fetched successfully.",
      result
    );
  } catch (err: any) {
    logger.error("search favorite songs controller:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}


async function getDownloadedSongs(req: Request, res: Response) {
  try {
    const songs = await song_service.getDownloadedSongs(
      req.user.user_id || req.body.user_id,
      req.body.page,
      req.body.limit,
    );

    if (!songs) {
      return response_service.notFoundResponse(res, "Songs not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Songs fetched successfully.",
      data: songs.data,
      Pagination: songs.Pagination,
    });

  } catch (err: any) {
    logger.error("Error fetching downloaded songs:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// search download songs ==========================================

export const searchDownloadedSongs = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = Number(req.user?.user_id);

    const search = String(req.body.search || "").trim();

    const page =
      req.body.page !== undefined && req.body.page !== ""
        ? Number(req.body.page)
        : 1;

    const limit =
      req.body.limit !== undefined && req.body.limit !== ""
        ? Number(req.body.limit)
        : 10;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required",
      });
    }

    const result = await song_service.searchDownloadedSongs(
      userId,
      search,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: "Downloaded songs fetched successfully",
      data: result.data,
      Pagination: result.Pagination,
    });
  } catch (error: any) {
    logger.error("Search Downloaded Songs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// all songs list ===============================================================
async function getAllSongs(req: Request, res: Response) {
  try {
    const songs = await song_service.getAllSongs(
      req.body.album_id,
      parseInt(req.body.page || 1),
      parseInt(req.body.limit || 10),
      req.user?.user_id || 0,
      req.body.for_admin,
      req.body.search,
    );

    if (!songs)
      return response_service.notFoundResponse(res, "Songs not found.");
    return response_service.successResponse(
      res,
      "Songs fetched successfully.",
      songs,
    );
  } catch (err: any) {
    logger.error("Error fetching all songs:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getAdminAllSongs(req: Request, res: Response) {
  try {
    const songs = await song_service.getAdminAllSongs(
      req.body.album_id,
      parseInt(req.body.page || 1),
      parseInt(req.body.limit || 10),
      req.user?.user_id || 0,
      req.body.for_admin,
      req.body.search,
    );

    if (!songs)
      return response_service.notFoundResponse(res, "Songs not found.");
    return response_service.successResponse(
      res,
      "Songs fetched successfully.",
      songs,
    );
  } catch (err: any) {
    logger.error("Error fetching all songs:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getTrendingSongs(req: Request, res: Response) {
  try {
    const songs = await song_service.getTrendingSongs(
      parseInt(req.body.page),
      parseInt(req.body.limit),
      req.user?.user_id,
    );
    if (!songs)
      return response_service.notFoundResponse(res, "Songs not found.");
    return response_service.successResponse(
      res,
      "Songs fetched successfully.",
      songs,
    );
  } catch (err: any) {
    logger.error("Error fetching trending songs:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function deleteSong(req: Request, res: Response) {
  try {
    const admin = req.user;
    if (!admin.admin_id)
      return response_service.badRequestResponse(
        res,
        "Only admins can delete songs.",
      );
    const songId = parseInt(req.body.song_id);
    const song = await song_service.deleteSong(songId);
    if (!song) return response_service.notFoundResponse(res, "Song not found.");
    return response_service.successResponse(
      res,
      "Song deleted successfully.",
      song,
    );
  } catch (err: any) {
    logger.error("Error deleting song:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export {
  getSong,
  setfavorite,
  setDownloaded,
  getMySongs,
  createMusic,
  updateSong,
  getNextSong,
  getfavoriteSongs,
  getAllSongs,
  searchFavoriteSongs,
  getDownloadedSongs,
  getTrendingSongs,
  deleteSong,
  getAdminAllSongs,
};
