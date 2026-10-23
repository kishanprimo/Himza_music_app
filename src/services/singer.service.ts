import db from "../models";

const {
  MusicSinger,
  Genre,
  favorites,
  User,
  favoriteArtists,
  singerGenre,
  song,
  History
} = db;
import { ISong } from "../types";
import { user_service } from ".";
import { Op, fn, col } from "sequelize";
import { logger } from "../utils";
async function addSongToArtist(songId: number, artistId: number) {
  try {
    const songSinger = await MusicSinger.create({
      song_id: songId,
      user_id: artistId,
    });
    if (songSinger) {
      return songSinger;
    }
    return null;
  } catch (err) {
    throw err;
  }
}

async function addSong(Song: Partial<ISong>): Promise<ISong | null> {
  try {
    const newMusic = await song.create(Song);
    if (newMusic) return newMusic.toJSON() as ISong;
    return null;
  } catch (err) {
    throw err;
  }
}

interface PaginatedMySongsResult {
  data: (ISong & { favorites_count: number })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function mySongs(
  artistId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedMySongsResult> {
  try {
    const offset = (page - 1) * pageSize;

    const { rows, count: total } = await MusicSinger.findAndCountAll({
      where: { user_id: artistId },
      limit: pageSize,
      offset,
      include: [
        {
          model: song,
          as: "song",
          include: [
            {
              model: Genre,
              as: "genre",
            },
          ],
        },
        {
          model: User,
          as: "singer",
          attributes: ["user_id", "full_name", "profile_pic"],
        },
      ],
    });

    const songIds = rows
      .map((record: any) => record.song?.song_id)
      .filter((id: any) => id != null);

    const [favouritesCounts, listensCounts] = songIds.length
      ? await Promise.all([
        favorites.findAll({
          attributes: [
            "song_id",
            [fn("COUNT", col("song_id")), "total"],
          ],
          where: {
            song_id: { [Op.in]: songIds },
          },
          group: ["song_id"],
          raw: true,
        }),

        History.findAll({
          attributes: [
            "song_id",
            [fn("COUNT", col("song_id")), "total"],
          ],
          where: {
            song_id: { [Op.in]: songIds },
          },
          group: ["song_id"],
          raw: true,
        }),
      ])
      : [[], []];

    const favouritesMap = new Map(
      favouritesCounts.map((item: any) => [
        Number(item.song_id),
        Number(item.total),
      ])
    );

    const listensMap = new Map(
      listensCounts.map((item: any) => [
        Number(item.song_id),
        Number(item.total),
      ])
    );

    const data = rows.map((record: any) => {
      const songData = record.get({ plain: true });
      const songId = Number(songData.song?.song_id);

      return {
        singer: songData.singer,
        ...songData.song,
        favourites_count: favouritesMap.get(songId) ?? 0,
        listens_count: listensMap.get(songId) ?? 0,
      };
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (err) {
    throw err;
  }
}

async function isMySong(songId: number, singerId: number) {
  try {
    const song = await MusicSinger.findOne({
      where: { song_id: songId, user_id: singerId },
    });
    if (song) return true;
    return false;
  } catch (err) {
    throw err;
  }
}

async function isSinger(userId: number): Promise<boolean> {
  try {
    const singer = await User.findOne({
      where: { user_id: userId, is_singer: true },
    });
    return !!singer;
  } catch (err) {
    throw err;
  }
}

async function isfavorite(userId: number, artistId: number): Promise<boolean> {
  try {
    const favorite = await favoriteArtists.findOne({
      where: { user_id: userId, artist_user_id: artistId },
    });
    return !!favorite;
  } catch (err) {
    throw err;
  }
}

// async function isDownloaded(userId:number,artistId:number): Promise<boolean> {
//   try {
//     const download = await 
//   } catch(err) {
//     throw err
//   }
// }

async function setfavorite(userId: number, artistId: number): Promise<boolean> {
  try {
    const favorite = await favoriteArtists.findOne({
      where: { user_id: userId, artist_user_id: artistId },
    });
    if (favorite) {
      await favoriteArtists.destroy({
        where: { user_id: userId, artist_user_id: artistId },
      });
      return false;
    } else {
      await favoriteArtists.create({
        user_id: userId,
        artist_user_id: artistId,
      });
      return true;
    }
  } catch (err) {
    throw err;
  }
}

async function getFavoriteArtists(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<{
  artists: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | null> {
  try {
    const offset = (page - 1) * limit;

    // First get only favorite artists
    const rows = await favoriteArtists.findAll({
      where: {
        user_id: userId,
      },
      attributes: ["artist_user_id"],
    });

    // Get only artists which are NOT deleted
    const validArtistIds = await User.findAll({
      where: {
        user_id: rows.map((row: any) => row.artist_user_id),
        is_deleted: false,
        is_singer: true,
      },
      attributes: ["user_id"],
    });

    const validIds = new Set(
      validArtistIds.map((artist: any) => artist.user_id)
    );

    // Remove deleted artists
    const validRows = rows.filter((row: any) =>
      validIds.has(row.artist_user_id)
    );

    // Correct total after removing deleted artists
    const total = validRows.length;

    // Apply pagination AFTER filtering deleted artists
    const paginatedRows = validRows.slice(
      offset,
      offset + limit
    );

    const artists = await Promise.all(
      paginatedRows.map(async (row: any) => {
        const { artist_user_id } = row.toJSON();

        const songs_count = await mySongsCount(
          Number(artist_user_id)
        );

        const artist = await user_service.getUser(
          {
            user_id: artist_user_id.toString(),
          },
          [],
          ["user_id", "full_name", "profile_pic"]
        );

        return {
          ...artist,
          songs_count,
        };
      })
    );

    return {
      artists,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    logger.error("Error in getFavoriteArtists:", err);
    throw err;
  }
}

// search favorite artist ===================================================
async function searchFavoriteArtists(
  userId: number,
  search: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const offset = (page - 1) * limit;
    const searchTerm = search?.trim();

    if (!searchTerm) return null;

    const { count, rows } = await favoriteArtists.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      distinct: true,
      col: "favorite_id",
      include: [
        {
          model: User,
          as: "artist",
          required: true, // 🔥 INNER JOIN
          where: {
            full_name: {
              [Op.iLike]: `${searchTerm}%`,
            },
          },
          attributes: ["user_id", "full_name", "profile_pic"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!rows.length) return null;

    const artists = await Promise.all(
      rows.map(async (row: any) => {
        const artist = row.artist;
        const songs_count = await mySongsCount(artist.user_id);

        return {
          ...artist.toJSON(),
          songs_count,
        };
      })
    );

    return {
      artists,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (err) {
    throw err;
  }
}



async function mySongsCount(artistId: number): Promise<number> {
  try {
    const count = await MusicSinger.count({ where: { user_id: artistId } });
    return count;
  } catch (err) {
    throw err;
  }
}

async function addGenreToArtist(genreId: number, artistId: number): Promise<boolean> {
  try {
    const genre = await Genre.findOne({ where: { genre_id: genreId } });
    if (!genre) return false;
    const artist = await User.findOne({ where: { user_id: artistId } });
    if (!artist) return false;
    await singerGenre.create({ genre_id: genreId, user_id: artistId });
    return true;
  } catch (err) {
    throw err;
  }
}

export async function removeSongArtists(song_id: number) {
  return await MusicSinger.destroy({
    where: { song_id },
  });
}

export default {
  addSongToArtist,
  addSong,
  mySongs,
  mySongsCount,
  isMySong,
  isSinger,
  isfavorite,
  setfavorite,
  getFavoriteArtists,
  searchFavoriteArtists,
  addGenreToArtist,
  removeSongArtists,
};
