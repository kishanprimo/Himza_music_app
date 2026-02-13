import db from "../models";

const {
  Album,
  AlbumSongs,
  AlbumSong,
  favoriteAlbums,
  Genre,
  MusicSinger,
  song,
  User,
} = db;
import { IAlbum, ISong } from "../types";
import { Sequelize, Order } from "sequelize";
import { song_service } from ".";

// create album =================================================
async function createAlbum(
  albumPayload: Partial<IAlbum>,
): Promise<IAlbum | null> {
  try {
    const album = await Album.create(albumPayload);
    return album.toJSON();
  } catch (err) {
    throw err;
  }
}

// add songs to album ===================================================
async function addSongsToAlbum(
  songIds: string[],
  albumId: string,
): Promise<ISong[] | null> {
  try {
    const ids: string[] = (
      await Promise.all(
        songIds.map(async (song_id: string) => {
          const data: any = await song.findOne({ where: { song_id: song_id } });
          return data ? data.song_id : null;
        }),
      )
    ).filter((id): id is string => id !== null);

    if (ids.length <= 0) return null;
    const albumSongs = await Promise.all(
      ids.map((song_id: string) =>
        AlbumSong.create({ album_id: albumId, song_id: song_id }),
      ),
    );
    return albumSongs.map((s) => s.toJSON());
  } catch (err) {
    throw err;
  }
}

// remove songs from album =====================================
async function removeSongFromAlbum(
  songIds: string[],
  albumId: string,
): Promise<number[] | null> {
  try {
    const albumSongs = await Promise.all(
      songIds.map(
        async (song_id: string) =>
          await AlbumSong.destroy({
            where: { album_id: albumId, song_id: song_id },
          }),
      ),
    );
    return albumSongs;
  } catch (err) {
    throw err;
  }
}
// update album ===============================================
async function updateAlbum(
  albumPayload: Partial<IAlbum>,
  where: Partial<IAlbum>,
): Promise<IAlbum | null> {
  try {
    const album = await Album.update(albumPayload, {
      where: where,
      returning: true,
    });
    if (album[1].length <= 0) return null;
    return album[1][0].toJSON();
  } catch (err) {
    throw err;
  }
}

// get album ============================================
async function getAlbum(
  where: Partial<IAlbum>,
  include?: any,
): Promise<IAlbum | null> {
  try {
    const album = await Album.findOne({
      where: where,
      include,
    });
    if (!album) return null;
    return album.toJSON();
  } catch (err) {
    throw err;
  }
}

// get all albums =============================================================
async function getAllAlbums(
  page: number = 1,
  pageSize: number = 10,
  sort_by?: string,
  sort_order?: string,
): Promise<{
  albums: IAlbum[];
  Pagination: {
    current_page: number;
    records_per_page: number;
    total_pages: number;
    total_records: number;
  };
}> {
  try {
    const offset = (page - 1) * pageSize;

    // Build a type-safe order clause only when both values are provided
    const order: Order = [];
    if (sort_by && sort_order) {
      const direction = sort_order.toUpperCase() === "DESC" ? "DESC" : "ASC";
      order.push([Sequelize.col(sort_by), direction]);
    }
    const albums = await Album.findAll({
      limit: pageSize,
      offset,
      attributes: {
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("songs.song_id")), "song_count"],
        ],
      },
      include: [
        {
          model: Genre,
          as: "albumGenre",
          attributes: ["genre_id", "name", "background_img"],
        },
        {
          model: AlbumSong,
          as: "songs",
          attributes: [], // Don't fetch song data, just use for count
          required: false,
        },
      ],
      group: ["Album.album_id", "albumGenre.genre_id"], // Only primary key here
      subQuery: false, // Avoids subquery wrapping issue
      ...(order.length > 0 && { order }),
    });
    const total = await Album.count({
      where: {
        is_private: false,
      },
    });

    return {
      albums: albums.map((album: any) => album.toJSON()),
      Pagination: {
        current_page: page,
        records_per_page: pageSize,
        total_pages: Math.ceil(total / pageSize),
        total_records: total,
      },
    };
  } catch (err) {
    throw err;
  }
}

async function getAlbumData(
  where: Partial<IAlbum>,
  user_id: number | null = null,
  include?: any,
): Promise<any[] | null> {
  try {
    const album = await AlbumSongs.findAll({
      where,
      order: [["album_song_id", "DESC"]],
      include,
    });
    if (!album || album.length === 0) return null;

    const songs = await Promise.all(
      album.map(async (entry: any) => {
        const rawEntry = entry.get({ plain: true });

        const song = rawEntry.song as ISong;
        if (!song) return null;

        if (user_id) {
          const is_favorite = await song_service.isfavorite(
            user_id,
            parseInt(song.song_id),
          );
          return { ...song, is_favorite };
        }
        return { ...song };
      }),
    );

    return songs.filter((song) => song !== null);
  } catch (err) {
    throw err;
  }
}

async function isfavorite(userId: number, albumId: number): Promise<boolean> {
  try {
    const favorite = await favoriteAlbums.findOne({
      where: { user_id: userId, album_id: albumId },
    });
    return !!favorite;
  } catch (err) {
    throw err;
  }
}

async function setfavorite(userId: number, albumId: number): Promise<boolean> {
  try {
    const favorite = await favoriteAlbums.findOne({
      where: { user_id: userId, album_id: albumId },
    });
    if (favorite) {
      await favoriteAlbums.destroy({
        where: { user_id: userId, album_id: albumId },
      });
      return false;
    } else {
      await favoriteAlbums.create({ user_id: userId, album_id: albumId });
      return true;
    }
  } catch (err) {
    throw err;
  }
}

async function getMyAlbums(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<{
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  albums: any[];
}> {
  try {
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Album.findAndCountAll({
      where: { user_id: userId },
      attributes: [
        "album_id",
        "title",
        "thumbnail",
        "description",
        "is_private",
        "createdAt",
        "updatedAt",
      ],
      limit,
      offset,
      order: [["album_id", "DESC"]],
      include: [
        {
          model: AlbumSong,
          as: "songs",
          attributes: ["album_song_id"],
          separate: true,
          order: [["album_song_id", "DESC"]],
          required: false,
          include: [
            {
              model: song,
              as: "song",
              attributes: ["song_id", "thumbnail", "title", "audio"],
              include: [
                {
                  model: MusicSinger,
                  as: "artists",
                  attributes: ["music_singer_id", "user_id"],
                  include: [
                    {
                      model: User,
                      as: "singer",
                      attributes: ["user_id", "full_name", "profile_pic"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    // Add songs_count without extra DB queries
    const albums = rows.map((album: any) => {
      const rawAlbum = album.get({ plain: true });
      return {
        ...rawAlbum,
        songs_count: rawAlbum.songs?.length || 0,
      };
    });

    return {
      albums,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      
    };
  } catch (err) {
    throw err;
  }
}



async function getFavoriteAlbums(
  userId: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  albums: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | null> {
  try {
    const offset = (page - 1) * limit;
    let albums = await favoriteAlbums.findAll({
      where: { user_id: userId },
      attributes: ["album_id"],
      limit,
      offset,
    });
    if (!albums || albums.length === 0) return null;
    const total = await favoriteAlbums.count({ where: { user_id: userId } });
    const albumIds = albums.map(
      (album: any) => album.get({ plain: true }).album_id,
    );
    albums = await Album.findAll({
      where: { album_id: albumIds },
      attributes: [
        "album_id",
        "title",
        "thumbnail",
        "description",
        "is_private",
        "createdAt",
        "updatedAt",
      ],
    });
    albums = albums.map((album: any) => album.toJSON());
    return {
      albums,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    throw err;
  }
}

async function deleteAlbum(albumId: number): Promise<number> {
  try {
    const result = await Album.destroy({ where: { album_id: albumId } });
    if (result === 0) return 0;
    AlbumSongs.destroy({ where: { album_id: albumId } });
    return 1;
  } catch (err) {
    throw err;
  }
}

export default {
  createAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  updateAlbum,
  getAlbum,
  getAlbumData,
  getAllAlbums,
  isfavorite,
  setfavorite,
  getMyAlbums,
  getFavoriteAlbums,
  deleteAlbum,
};
