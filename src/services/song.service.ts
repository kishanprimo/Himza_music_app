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
  AlbumSongs,
  History
} = db;
import { ISong } from "../types";
import { col, fn, Op } from "sequelize";

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
  songId: number
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
    return songs.map((song:any) => (song as any).song_id.toString());
  } catch (err) {
    logger.error("Error counting songs:", err);
    throw err;
  }
}

async function getfavoriteSongs(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<{ data: any[]; total: number; page: number; totalPages: number; limit: number }> {
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
      total,
      limit,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    throw err;
  }
}

async function getDownloadedSongs(
  userId: number,
  page: number = 1,
  limit: number = 10
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


async function getAllSongs(
  albumId?: number,
  page: number = 1,
  limit: number = 10,
  userId: number = 0,
  for_admin: boolean = false,
  search?: string
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
      excludeSongIds = albumSongs.map((song:any) => song.get("song_id") as number);
    }

    const whereClause: any = {};
    if (excludeSongIds.length > 0) {
      whereClause.song_id = { [Op.notIn]: excludeSongIds };
    }
    console.log(search);

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
      order: [["createdAt", "DESC"]],
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
    const data = await Promise.all(
      rows.map(async (song:any) => {
        const is_favorite = await favorites.findOne({
          where: { user_id: userId, song_id: song.get("song_id") },
        });
        const download_counts = await Downloads.count({
          where: { song_id: song.get("song_id") },
        });
        const listen_counts = await History.count({
          where: { song_id: song.get("song_id") },
        });
        return {
          ...song.toJSON(),
          is_favorite: !!is_favorite,
          download_counts,
          listen_counts,
        };
      })
    );

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

async function getTrendingSongs(
  page: number = 1,
  limit: number = 10
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
    const songIds = songsData.map((song:any) => song.get("song_id") as number);
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
    const total = await song.count({ where: { song_id: songIds } });
    return {
      data: songs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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
  getAllSongs,
  isDownloaded,
  getDownloadedSongs,
  getTrendingSongs,
  deleteSong,
};
