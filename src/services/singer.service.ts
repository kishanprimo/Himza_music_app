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
} =db;
import { ISong } from "../types";
import { user_service } from ".";
import {Op} from 'sequelize';
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
    console.log(rows);
    
    const data = await Promise.all(
      rows?.map(async (record:any) => {
        const songData = record.get({ plain: true });
        const favourites_count = await favorites.count({
          where: { song_id: songData.song.song_id },
        });
        const listens_count = await History.count({
          where: { song_id: songData.song.song_id },
        });
        return {
          singer: songData.singer,
          ...songData.song,
          favourites_count,
          listens_count,
        };
      })
    );

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
    // Count total favorite artists for pagination
    const total = await favoriteArtists.count({
      where: { user_id: userId },
    });

    // Fetch artist_user_ids
    const rows = await favoriteArtists.findAll({
      where: { user_id: userId },
      attributes: ["artist_user_id"],
      limit,
      offset,
    });

    // Resolve all artist details
    const artists = await Promise.all(
      rows.map(async (row:any) => {
        const { artist_user_id } = row.toJSON();
        const songs_count = await mySongsCount(
          parseInt(artist_user_id)
        );
        return {
          ...await user_service.getUser(
            { user_id: artist_user_id.toString() },
            [],
            ["user_id", "full_name", "profile_pic"]
          ),
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
    console.error("Error in getFavoriteArtists:", err);
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
  addGenreToArtist
};
