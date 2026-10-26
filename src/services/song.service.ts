import { logger } from "../utils";
import db from "../models";

const {
  song,
  favorites,
  Genre,
  Downloads,
  MusicSinger,
  MovieSongConnection,
  Movie,
  User,
  // The model is registered as "AlbumSong"; "AlbumSongs" was undefined.
  AlbumSong: AlbumSongs,
  History,
} = db;
import { ISong } from "../types";
import { col, fn, Op } from "sequelize";
import sequelize from "sequelize";

async function getSong(songId: number, include?: any): Promise<ISong | null> {
  try {
    const songs = await song.findOne({
      where: { song_id: songId },
      include,
    });
    const favorite_count = await favorites.count({
      where: { song_id: songId },
    });
    if (songs) return { ...songs.toJSON(), favorite_count } as ISong;
    return null;
  } catch (err) {
    throw err;
  }
}

async function setfavorite(userId: number, songId: number): Promise<boolean> {
  try {
    const favorite = await favorites.findOne({
      where: { user_id: userId, song_id: songId },
    });
    if (favorite) {
      await favorites.destroy({ where: { user_id: userId, song_id: songId } });
      return false;
    } else {
      await favorites.create({ user_id: userId, song_id: songId });
      return true;
    }
  } catch (err) {
    throw err;
  }
}

async function setDownloaded(userId: number, songId: number): Promise<boolean> {
  try {
    const download = await Downloads.findOne({
      where: { user_id: userId, song_id: songId },
    });
    if (download) {
      await Downloads.destroy({ where: { user_id: userId, song_id: songId } });
      return false;
    } else {
      await Downloads.create({ user_id: userId, song_id: songId });
      return true;
    }
  } catch (err) {
    throw err;
  }
}

// is Downloaded or not
async function isDownloaded(
  userId: number | undefined,
  songId: number,
): Promise<boolean> {
  if (!userId) return false;

  const download = await Downloads.findOne({
    where: {
      user_id: userId,
      song_id: songId,
    },
  });

  return !!download;
}

async function isfavorite(userId: number, songId: number): Promise<boolean> {
  try {
    const favorite = await favorites.findOne({
      where: { user_id: userId, song_id: songId },
    });
    return !!favorite;
  } catch (err) {
    throw err;
  }
}

async function updateSong(songId: number, data: any) {
  try {
    const songs = await song.update(data, {
      where: { song_id: songId },
      returning: true,
    });
    if (songs[1].length <= 0) return null;
    return songs[1][0].toJSON() as ISong;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

async function getTotalSongs(): Promise<string[]> {
  try {
    const songs = await song.findAll({ attributes: ["song_id"] });
    return songs.map((song: any) => (song as any).song_id.toString());
  } catch (err) {
    logger.error("Error counting songs:", err);
    throw err;
  }
}

async function getfavoriteSongs(
  userId: number,
  page: number = 1,
  limit: number = 10,
): Promise<any> {
  try {
    const offset = (page - 1) * limit;
    let songs: any[] = await favorites.findAll({
      where: { user_id: userId },
      limit,
      offset,
      include: [
        {
          model: song,
          as: "song",
          include: [
            {
              model: Genre,
              as: "genre",
              attributes: ["genre_id", "name"],
            },
            {
              model: MusicSinger,
              as: "artists",
              include: [
                {
                  model: User,
                  as: "singer",
                  attributes: ["user_id", "full_name", "profile_pic"],
                },
              ],
              attributes: ["music_singer_id"],
            },
            {
              model: MovieSongConnection,
              as: "movie",
              include: [
                {
                  model: Movie,
                  as: "movie_details",
                  attributes: ["movie_id", "title", "poster"],
                },
              ],
              attributes: ["movie_song_id"],
            },
          ],
        },
      ],
    });
    const total = await favorites.count({ where: { user_id: userId } });
    songs = await songs.map((song) => song.get("song"));
    return {
      data: songs,
      pagination: {
        current_page: page,
        records_per_page: limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },

    };
  } catch (err) {
    throw err;
  }
}

// search favorite Songs ====================================

async function searchFavoriteSongs(
  userId: number,
  search: string,
  page: number = 1,
  limit: number = 10,
) {
  try {
    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 10;
    const offset = (currentPage - 1) * perPage;

    if (!search || !search.trim()) {
      return {
        data: [],
        Pagination: {
          current_page: currentPage,
          records_per_page: perPage,
          total_pages: 0,
          total_records: 0,
        },
      };
    }

    const { count, rows } = await favorites.findAndCountAll({
      where: { user_id: userId },
      limit: perPage,
      offset,
      distinct: true,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: song,
          as: "song",
          required: true,
          where: {
            title: { [Op.iLike]: `${search.trim()}%` },
          },
          include: [
            {
              model: Genre,
              as: "genre",
              attributes: ["genre_id", "name"],
            },
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
            {
              model: MovieSongConnection,
              as: "movie",
              attributes: ["movie_song_id"],
              include: [
                {
                  model: Movie,
                  as: "movie_details",
                  attributes: ["movie_id", "title", "poster"],
                },
              ],
            },
          ],
        },
      ],
    });

    const songs = rows.map((fav: any) => fav.get({ plain: true }).song);

    return {
      data: songs,
      Pagination: {
        current_page: currentPage,
        records_per_page: perPage,
        total_pages: Math.ceil(count / perPage),
        total_records: count,
      },
    };
  } catch (err) {
    throw err;
  }
}

async function getDownloadedSongs(
  userId: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: any[];
  Pagination: {
    current_page: number;
    records_per_page: number;
    total_pages: number;
    total_records: number;
  };
}> {
  try {
    const offset = (page - 1) * limit;
    let songs: any[] = await Downloads.findAll({
      where: { user_id: userId },
      limit,
      offset,
      include: [
        {
          model: song,
          as: "song",
          include: [
            {
              model: Genre,
              as: "genre",
              attributes: ["genre_id", "name"],
            },
            {
              model: MusicSinger,
              as: "artists",
              include: [
                {
                  model: User,
                  as: "singer",
                  attributes: ["user_id", "full_name", "profile_pic"],
                },
              ],
              attributes: ["music_singer_id"],
            },
            {
              model: MovieSongConnection,
              as: "movie",
              include: [
                {
                  model: Movie,
                  as: "movie_details",
                  attributes: ["movie_id", "title", "poster"],
                },
              ],
              attributes: ["movie_song_id"],
            },
          ],
        },
      ],
    });
    songs = await songs.map((song) => song.get("song"));
    const total = await Downloads.count({ where: { user_id: userId } });
    return {
      data: songs,
      Pagination: {
        current_page: page,
        records_per_page: limit,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  } catch (err) {
    throw err;
  }
}

// search downloaded songs ===================================
async function searchDownloadedSongs(
  userId: number,
  search: string,
  page: number = 1,
  limit: number = 10,
) {
  try {
    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 10;
    const offset = (currentPage - 1) * perPage;

    if (!search || !search.trim()) {
      return {
        data: [],
        Pagination: {
          current_page: currentPage,
          records_per_page: perPage,
          total_pages: 0,
          total_records: 0,
        },
      };
    }

    const { count, rows } = await Downloads.findAndCountAll({
      where: { user_id: userId },
      subQuery: false,
      distinct: true,
      col: "download_id",
      limit: perPage,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: song,
          as: "song",
          required: true,
          where: {
            title: { [Op.iLike]: `${search.trim()}%` },
          },
          include: [
            {
              model: Genre,
              as: "genre",
              attributes: ["genre_id", "name"],
            },
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
            {
              model: MovieSongConnection,
              as: "movie",
              attributes: ["movie_song_id"],
              include: [
                {
                  model: Movie,
                  as: "movie_details",
                  attributes: ["movie_id", "title", "poster"],
                },
              ],
            },
          ],
        },
      ],
    });

    const songs = rows.map((item: any) => item.get({ plain: true }).song);

    return {
      data: songs,
      Pagination: {
        current_page: currentPage,
        records_per_page: perPage,
        total_pages: Math.ceil(count / perPage),
        total_records: count,
      },
    };
  } catch (err) {
    throw err;
  }
}

// all songs =====================================================
// Adds is_favorite / is_downloaded (for userId) and download / listen counts
// to a page of songs with 4 grouped queries instead of 4 queries per song.
async function withSongStats(rows: any[], userId: number) {
  const ids = rows.map((item: any) => item.get("song_id"));

  // Fetch favorites, downloads and counts in batches
  const [favs, userDownloads, downloadCounts, listenCounts] =
    ids.length > 0
      ? await Promise.all([
        userId
          ? favorites.findAll({
            where: {
              user_id: userId,
              song_id: { [Op.in]: ids },
            },
            attributes: ["song_id"],
            raw: true,
          })
          : Promise.resolve([]),

        userId
          ? Downloads.findAll({
            where: {
              user_id: userId,
              song_id: { [Op.in]: ids },
            },
            attributes: ["song_id"],
            raw: true,
          })
          : Promise.resolve([]),

        Downloads.findAll({
          where: {
            song_id: { [Op.in]: ids },
          },
          attributes: [
            "song_id",
            [sequelize.fn("COUNT", sequelize.col("song_id")), "total"],
          ],
          group: ["song_id"],
          raw: true,
        }),

        History.findAll({
          where: {
            song_id: { [Op.in]: ids },
          },
          attributes: [
            "song_id",
            [sequelize.fn("COUNT", sequelize.col("song_id")), "total"],
          ],
          group: ["song_id"],
          raw: true,
        }),
      ])
      : [[], [], [], []];

  // Create lookup sets/maps for fast access
  const favSet = new Set(
    favs.map((item: any) => Number(item.song_id)),
  );

  const downloadedSet = new Set(
    userDownloads.map((item: any) => Number(item.song_id)),
  );

  const downloadCountMap = new Map(
    downloadCounts.map((item: any) => [
      Number(item.song_id),
      Number(item.total),
    ]),
  );

  const listenCountMap = new Map(
    listenCounts.map((item: any) => [
      Number(item.song_id),
      Number(item.total),
    ]),
  );

  // Attach computed values without per-song queries
  const data = rows.map((item: any) => {
    const songId = Number(item.get("song_id"));

    return {
      ...item.toJSON(),
      is_favorite: userId ? favSet.has(songId) : false,
      is_downloaded: userId ? downloadedSet.has(songId) : false,
      download_counts: downloadCountMap.get(songId) ?? 0,
      listen_counts: listenCountMap.get(songId) ?? 0,
    };
  });

  return data;
}

async function getAllSongs(
  albumId?: number,
  page: number = 1,
  limit: number = 10,
  userId: number = 0,
  for_admin: boolean = false,
  search?: string,
): Promise<{
  data: any[];
  Pagination: {
    current_page: number;
    records_per_page: number;
    total_pages: number;
    total_records: number;
  };
}> {
  try {
    const offset = (page - 1) * limit;

    // Exclude songs in the album, if albumId is provided
    let excludeSongIds: number[] = [];
    if (albumId) {
      const albumSongs = await AlbumSongs.findAll({
        where: {
          ...(albumId && { album_id: albumId }),
          ...(for_admin && { status: true }),
        },
        attributes: ["song_id"],
      });
      excludeSongIds = albumSongs.map(
        (song: any) => song.get("song_id") as number,
      );
    }

    const whereClause: any = {};
    if (excludeSongIds.length > 0) {
      whereClause.song_id = { [Op.notIn]: excludeSongIds };
    }

    const { count, rows } = await song.findAndCountAll({
      where: {
        ...whereClause,
        ...(search
          ? {
            [Op.or]: [
              { title: { [Op.iLike]: `%${search}%` } }, // song title match
              { "$artists.singer.full_name$": { [Op.iLike]: `%${search}%` } }, // artist name match
            ],
          }
          : {}),
      },
      limit,
      offset,
      // order: [["createdAt", "DESC"]],
      order: [[sequelize.literal("RANDOM()")]],
      distinct: true,
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["genre_id", "name"],
        },
        {
          model: MusicSinger,
          as: "artists",
          attributes: ["music_singer_id"],
          include: [
            {
              model: User,
              as: "singer",
              attributes: ["user_id", "full_name", "profile_pic"],
              required: true,
            },
          ],
        },
        {
          model: MovieSongConnection,
          as: "movie",
          attributes: ["movie_song_id"],
          include: [
            {
              model: Movie,
              as: "movie_details",
              attributes: ["movie_id", "title", "poster"],
            },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);
    const data = await withSongStats(rows, userId);

    return {
      data,
      Pagination: {
        current_page: page,
        records_per_page: limit,
        total_pages: totalPages,
        total_records: count,
      },
    };
  } catch (err) {
    logger.error("Error fetching paginated songs:", err);
    throw err;
  }
}

async function getAdminAllSongs(
  albumId?: number,
  page: number = 1,
  limit: number = 10,
  userId: number = 0,
  for_admin: boolean = false,
  search?: string,
): Promise<{
  data: any[];
  Pagination: {
    current_page: number;
    records_per_page: number;
    total_pages: number;
    total_records: number;
  };
}> {
  try {
    const offset = (page - 1) * limit;

    // Exclude songs in the album, if albumId is provided
    let excludeSongIds: number[] = [];
    if (albumId) {
      const albumSongs = await AlbumSongs.findAll({
        where: {
          ...(albumId && { album_id: albumId }),
          ...(for_admin && { status: true }),
        },
        attributes: ["song_id"],
      });
      excludeSongIds = albumSongs.map(
        (song: any) => song.get("song_id") as number,
      );
    }

    const whereClause: any = {};
    if (excludeSongIds.length > 0) {
      whereClause.song_id = { [Op.notIn]: excludeSongIds };
    }

    const { count, rows } = await song.findAndCountAll({
      where: {
        ...whereClause,
        ...(search
          ? {
            [Op.or]: [
              { title: { [Op.iLike]: `%${search}%` } }, // song title match
              // Search by singer name
              sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM "music_singers" AS ms
                INNER JOIN "users" AS u
                  ON u."user_id" = ms."user_id"
                WHERE ms."song_id" = "song"."song_id"
                  AND u."full_name" ILIKE '%${search.replace(/'/g, "''")}%'
              )
            `),
            ],
          }
          : {}),
      },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      // order: [[sequelize.literal("RANDOM()")]],
      distinct: true,
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["genre_id", "name"],
        },
        {
          model: MusicSinger,
          as: "artists",
          attributes: ["music_singer_id"],
          include: [
            {
              model: User,
              as: "singer",
              attributes: ["user_id", "full_name", "profile_pic"],
              required: true,
            },
          ],
        },
        {
          model: MovieSongConnection,
          as: "movie",
          attributes: ["movie_song_id"],
          include: [
            {
              model: Movie,
              as: "movie_details",
              attributes: ["movie_id", "title", "poster"],
            },
          ],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);
    const data = await withSongStats(rows, userId);

    return {
      data,
      Pagination: {
        current_page: page,
        records_per_page: limit,
        total_pages: totalPages,
        total_records: count,
      },
    };
  } catch (err) {
    logger.error("Error fetching paginated songs:", err);
    throw err;
  }
}

// trending songs list =====================================================
async function getTrendingSongs(
  page: number = 1,
  limit: number = 10,
  userId: number = 0,
): Promise<any> {
  try {
    const songsData = await History.findAll({
      attributes: [
        "song_id",
        [fn("COUNT", col("song_id")), "count"], // Aggregate count as an alias
      ],
      group: ["song_id"],
      order: [[fn("COUNT", col("song_id")), "DESC"]],
    });
    const songIds = songsData.map((song: any) => song.get("song_id") as number);

    const songs = await song.findAll({
      where: { song_id: songIds },
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["genre_id", "name"],
        },
        {
          model: MusicSinger,
          as: "artists",
          include: [
            {
              model: User,
              as: "singer",
              attributes: ["user_id", "full_name", "profile_pic"],
            },
          ],
          attributes: ["music_singer_id"],
        },
        {
          model: MovieSongConnection,
          as: "movie",
          include: [
            {
              model: Movie,
              as: "movie_details",
              attributes: ["movie_id", "title", "poster"],
            },
          ],
          attributes: ["movie_song_id"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    // for favorite and download parameter ==================================
    // Get song IDs from fetched songs
    const fetchedSongIds = songs.map((s: any) => s.get("song_id"));

    // Get user favorites in ONE query
    const userFavorites = userId
      ? await favorites.findAll({
        where: {
          user_id: userId,
          song_id: { [Op.in]: fetchedSongIds },
        },
        attributes: ["song_id"],
      })
      : [];

    // Get user downloads in ONE query
    const userDownloads = userId
      ? await Downloads.findAll({
        where: {
          user_id: userId,
          song_id: { [Op.in]: fetchedSongIds },
        },
        attributes: ["song_id"],
      })
      : [];

    const favoriteSet = new Set(userFavorites.map((f: any) => f.song_id));

    const downloadSet = new Set(userDownloads.map((d: any) => d.song_id));

    // Attach flags to each song
    const finalSongs = songs.map((s: any) => {
      const songId = s.get("song_id");

      return {
        ...s.toJSON(),
        is_favorite: favoriteSet.has(songId),
        is_downloaded: downloadSet.has(songId),
      };
    });
    const total = await song.count({ where: { song_id: songIds } });
    return {
      data: finalSongs,
      pagination: {
        current_page: page,
        records_per_page: limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    logger.error("Error fetching trending songs:", err);
    throw err;
  }
}

async function deleteSong(songId: number): Promise<any> {
  try {
    const songs = await song.destroy({ where: { song_id: songId } });
    return songs;
  } catch (err) {
    logger.error("Error deleting song:", err);
    throw err;
  }
}

export default {
  getSong,
  setfavorite,
  isfavorite,
  setDownloaded,
  updateSong,
  getTotalSongs,
  getfavoriteSongs,
  searchFavoriteSongs,
  getAllSongs,
  isDownloaded,
  getDownloadedSongs,
  searchDownloadedSongs,
  getTrendingSongs,
  deleteSong,
  getAdminAllSongs,
};
