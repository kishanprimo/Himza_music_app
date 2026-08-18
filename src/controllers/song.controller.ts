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

const {
  Genre,
  Movie,
  MovieSongConnection,
  MusicSinger,
  favoriteArtists,
  favorites,
} = db;
import { log } from "console";

async function getSong(req: Request, res: Response) {
  console.log("getSong", req.body, req.user);
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
    console.log("is_favorite", req.user?.user_id);
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
    const isDownloaded = await song_service.setDownloaded(user.user_id, songId);
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
    const artist = await user_service.getUser(
      { user_id: req.body.artist_id, is_singer: true },
      [],
      ["user_id", "full_name", "profile_pic"],
    );

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;

    if (!artist)
      return response_service.notFoundResponse(res, "Artist not found.");
    let is_favorite = false;
    let artist_favorite = false;


    if (req.user.user_id)
      is_favorite = await singer_service.isfavorite(
        req.user.user_id,
        req.body.artist_id,
      );

    if (req.user.user_id) {
      const fav = await favoriteArtists.findOne({
        where: {
          user_id: req.user.user_id,
          artist_user_id: req.body.artist_id,
        },
      });

      artist_favorite = fav ? true : false;
    }

    const songs_count = await singer_service.mySongsCount(
      parseInt(req.body.artist_id),
    );
    const likes_count = await favoriteArtists.count({
      where: { artist_user_id: req.body.artist_id },
    });

    let songs: any = await singer_service.mySongs(
      parseInt(req.body.artist_id),
      page,
      limit
    );

    const formattedSongs = await Promise.all(
      songs.data.map(async (song: any) => {
        const { singer, ...rest } = song;

        return {
          ...rest,
          singer: {
            ...singer,
            is_favorite,
            songs_count,
            likes_count,
          },
          artist_favorite,
          is_favorite: req.user.user_id
            ? await song_service.isfavorite(req.user?.user_id, song.song_id)
            : false,
          is_downloaded: req.user.user_id
            ? await song_service.isDownloaded(req.user?.user_id, song.song_id)
            : false,
          likes_count: await favorites.count({
            where: { song_id: song.song_id },
          }),
        };
      })
    );
    if (formattedSongs.length > 0) {
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
        }
      );
    } else {
      const singer = await user_service.getUser(
        { user_id: req.body.artist_id, is_singer: true },
        [],
        ["user_id", "full_name", "profile_pic"]
      );

      let is_favorite = false;

      if (req.user.user_id) {
        is_favorite = await singer_service.isfavorite(
          req.user.user_id,
          req.body.artist_id
        );
      }

      const songs_count = await singer_service.mySongsCount(
        parseInt(req.body.artist_id)
      );

      // return response_service.successResponse(
      //   res,
      //   "Songs fetched successfully.",
      //   {
      //     artist_favorite,
      //     pagination: {
      //       total: 0,
      //       page,
      //       pageSize: limit,
      //       totalPages: 0,
      //     },
      //     data: [
      //       {
      //         singer: {
      //           ...singer,
      //           is_favorite,
      //           songs_count,
      //         },
      //       },
      //     ],
      //   }
      // );

      if (formattedSongs.length === 0) {
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
            data: [],
          }
        );
      }
    }
  } catch (err: any) {
    logger.error("Error fetching songs:", err);
    console.log(err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function createMusic(req: Request, res: Response) {
  try {

    console.log("========== CREATE MUSIC ==========");
    console.log("BODY:", req.body);
    console.log("ARTIST IDS:", req.body.artist_ids);
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
      audio: audio.path,
      thumbnail: thumbnail.path,
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

    console.log("ARTIST IDS:", artistIds);
    console.log("CREATED SONG ID:", song.song_id);

    // 3. Add artists to music_singers
    for (const artistId of artistIds) {
      const singerId = Number(artistId);

      if (!singerId) continue;

      const isSinger = await singer_service.isSinger(singerId);

      console.log(
        `Artist ${singerId} is singer:`,
        isSinger,
      );

      if (isSinger) {
        const songSinger =
          await singer_service.addSongToArtist(
            Number(song.song_id),
            singerId,
          );

        console.log(
          "MusicSinger created:",
          songSinger,
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


    // if (updatedData.artist_ids) {
    //   try {
    //     if (typeof updatedData.artist_ids === "string") {
    //       updatedData.artist_ids = JSON.parse(updatedData.artist_ids);
    //     }
    //   } catch (error) {
    //     updatedData.artist_ids = [];
    //   }
    // }
    //     console.log(updatedData);

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
  console.log("Search keyword !@12", req.body);
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
    console.error("Search Downloaded Songs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// all songs list ===============================================================
async function getAllSongs(req: Request, res: Response) {
  try {
    console.log(req.body);
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
    console.log(req.body);
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
    console.log(err);
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
