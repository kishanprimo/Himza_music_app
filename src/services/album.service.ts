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
  searchPlaylistHistory,
  favorites,
  Downloads,
   History,
   Playlist,
   PlaylistSong,
} = db;
import { IAlbum, ISong, IPlaylist } from "../types";
import { Sequelize, Order } from "sequelize";
import { song_service } from ".";
import { Op } from "sequelize";


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

async function removeSongFromPlaylist(
  songIds: string[],
  playlistId: string
): Promise<number[] | null> {
  try {
    const playlistSongs = await Promise.all(
      songIds.map(
        async (song_id: string) =>
          await PlaylistSong.destroy({
            where: { playlist_id: playlistId, song_id: song_id },
          })
      )
    );

    return playlistSongs;
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
    const album = await Album.findOne({ where });

    if (!album) return null;

    await album.update(albumPayload);

    return album.toJSON();
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

async function getPlaylist(
  where: Partial<IPlaylist>,
  include?: any,
): Promise<IPlaylist | null> {
  try {
    const playlist = await Playlist.findOne({
      where: where,
      include,
    });

    if (!playlist) return null;

    return playlist.toJSON();
  } catch (err) {
    throw err;
  }
}

async function deletePlaylist(playlistId: number): Promise<number> {
  try {
    const result = await Playlist.destroy({ where: { playlist_id: playlistId } });

    if (result === 0) return 0;

    await PlaylistSong.destroy({ where: { playlist_id: playlistId } });

    return 1;
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
  console.log("setfavorite", userId, albumId, favoriteAlbums);
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
  limit: number = 10,
): Promise<any> {
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
        const songsCount = rawAlbum.songs?.length || 0;

         delete rawAlbum.songs; 
      return {
        ...rawAlbum,
       songs_count: songsCount,
      };
    });

    return {
      albums,
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

async function getMyPlaylists(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<any> {
  try {
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Playlist.findAndCountAll({
      where: { user_id: userId },
      attributes: [
        "playlist_id",
        "title",
        "thumbnail",
        "description",
        "is_private",
        "createdAt",
        "updatedAt",
      ],
      limit,
      offset,
      order: [["playlist_id", "DESC"]],
      include: [
        {
          model: PlaylistSong,
          as: "songs",
          attributes: ["playlist_song_id"],
          separate: true,
          order: [["playlist_song_id", "DESC"]],
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

    const playlists = rows.map((playlist: any) => {
      const rawPlaylist = playlist.get({ plain: true });
      const songsCount = rawPlaylist.songs?.length || 0;

      delete rawPlaylist.songs;

      return {
        ...rawPlaylist,
        songs_count: songsCount,
      };
    });

    return {
      playlists,
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
async function addToPlaylistSearchHistory(
  userId: number,
  albumId: number
): Promise<any> {
  try {
    if (!albumId) throw new Error("album_id is required");

    const whereCondition = {
      user_id: userId,
      album_id: albumId,
    };

    let history = await searchPlaylistHistory.findOne({
      where: whereCondition,
    });

    if (history) {
      await history.update({}); // refresh updatedAt
      return history.toJSON();
    }

    history = await searchPlaylistHistory.create({
      user_id: userId,
      album_id: albumId,
    });

    return history.toJSON();
  } catch (err) {
    throw err;
  }
}
async function removeFromPlaylistSearchHistory(
  userId: number,
  searchId: number
): Promise<number> {
  try {
    if (!searchId || isNaN(searchId)) {
      throw new Error("Invalid search_id");
    }

    return await searchPlaylistHistory.destroy({
      where: {
        user_id: userId,
        search_id: searchId,
      },
    });
  } catch (err) {
    throw err;
  }
}
async function getPlaylistSearchHistory(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<any> {
  try {
    page = parseInt(page as any, 10);
    limit = parseInt(limit as any, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const history = await searchPlaylistHistory.findAndCountAll({
      where: { user_id: userId },
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: Album,
          as: "album",
          include: [
            {
              model: AlbumSong,
              as: "songs",
              attributes: ["album_song_id"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!history || history.count === 0) {
      return {
        albums: [],
        pagination: {
          current_page: page,
          records_per_page: limit,
          total_records: 0,
          total_pages: 0,
        },
      };
    }

    const albums = history.rows.map((item: any) => {
      const raw = item.get({ plain: true }).album;

      return {
        search_id: item.search_id, // ✅ added this line
        ...raw,
        songs_count: raw?.songs?.length || 0,
      };
    });

    return {
      albums,
      pagination: {
        current_page: page,
        records_per_page: limit,
        total_records: history.count,
        total_pages: Math.ceil(history.count / limit),
      },
    };
  } catch (err) {
    throw err;
  }
}

async function searchPlaylist(
  userId: number,
  search: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const currentPage = Number(page) || 1;
    const perPage = Number(limit) || 10;
    const offset = (currentPage - 1) * perPage;

    if (!search?.trim()) {
      return {
        playlists: [],
        total: 0,
        page: currentPage,
        limit: perPage,
        totalPages: 0,
      };
    }

    const { count, rows } = await Playlist.findAndCountAll({
      where: {
        user_id: userId,
        [Op.and]: [
          Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("title")), {
            [Op.like]: `%${search.trim().toLowerCase()}%`,
          }),
        ],
      },
      limit: perPage,
      offset,
      order: [["playlist_id", "DESC"]],
      include: [
        {
          model: PlaylistSong,
          as: "songs",
          attributes: ["playlist_song_id"],
          separate: true,
          order: [["playlist_song_id", "DESC"]],
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

    const playlists = rows.map((playlist: any) => {
      const rawPlaylist = playlist.get({ plain: true });

      return {
        ...rawPlaylist,
        songs_count: rawPlaylist.songs?.length || 0,
      };
    });

    return {
      playlists,
      pagination: {
        current_page: currentPage,
        records_per_page: perPage,
        total_records: count,
        total_pages: Math.ceil(count / perPage),
      },
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

// search favorite album service ===================================

async function searchFavoriteAlbums(
  userId: number,
  search: string,
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

    // Get favorite album IDs of user
    const favoriteList = await favoriteAlbums.findAll({
      where: { user_id: userId },
      attributes: ["album_id"],
    });

    if (!favoriteList.length) return null;

    const albumIds = favoriteList.map(
      (item: any) => item.get({ plain: true }).album_id,
    );

    // Search albums from those IDs
    const { rows, count } = await Album.findAndCountAll({
      where: {
        album_id: albumIds,
        title: {
          [Op.iLike]: `%${search}%`, // PostgreSQL case-insensitive search
        },
      },
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
      order: [["createdAt", "DESC"]],
    });

    console.log("rows", rows);

    if (!rows.length) return null;

    return {
      albums: rows.map((album: any) => album.toJSON()),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  } catch (err) {
    throw err;
  }
}

async function deleteAlbum(albumId: number): Promise<number> {
  try {
    const result = await Album.destroy({ where: { album_id: albumId } });
    if (result === 0) return 0;
      await AlbumSong.destroy({ where: { album_id: albumId } });
    return 1;
  } catch (err) {
    throw err;
  }
}

async function getAlbumWithSongs(albumId: number) {
  try {
    const album = await Album.findOne({
      where: { album_id: albumId },
      include: [
        {
          model: AlbumSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
              // attributes: ["song_id", "title", "thumbnail", "audio"],
            },
          ],
        },
      ],
    });

    if (!album) return null;

    const data = album.toJSON();

    // ✅ Clean songs array
    const songs = data.songs.map((item: any) => item.song);

    return {
      ...data,
      songs,
    };
  } catch (err) {
    throw err;
  }
}

async function getAlbumSongs(
  albumId: number,
  page: number = 1,
  limit: number = 10,
  user_id?: number
) {
  const offset = (page - 1) * limit;

    let album_favorite = false;

  if (user_id) {
    const fav = await favoriteAlbums.findOne({
      where: { user_id: user_id, album_id: albumId },
    });

    album_favorite = !!fav;
  }

  const { rows, count } = await AlbumSong.findAndCountAll({
    where: { album_id: albumId },
    limit,
    offset,
    order: [["album_song_id", "DESC"]],
    include: [
      {
        model: song,
        as: "song",
        attributes: ["song_id", "title", "thumbnail", "audio"],
        include: [
          {
            model: favorites,
            as: "downloadedBy",
            attributes: [],
            required: false,
            where: user_id ? { user_id } : undefined,
          },
          {
            model: Downloads,
            as: "favoriteBy",
            attributes: [],
            required: false,
            where: user_id ? { user_id } : undefined,
          },
        ],
      },
    ],
  });

  const songs = rows.map((item: any) => {
    const s = item.song;

    return {
      song_id: s.song_id,
      title: s.title,
      thumbnail: s.thumbnail,
      audio: s.audio,
      is_favorite: s.favoriteBy?.length > 0,
      is_downloaded: s.downloadedBy?.length > 0,
    };
  });

  return {
    album_favorite, 
    songs,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

async function createPlaylist(
  playlistPayload: Partial<IPlaylist>,
): Promise<IPlaylist | null> {
  try {
    const playlist = await Playlist.create(playlistPayload);
    return playlist.toJSON();
  } catch (err) {
    throw err;
  }
}

async function addSongsToPlaylist(
  songIds: string[],
  playlistId: string,
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

    const playlistSongs = await Promise.all(
      ids.map((song_id: string) =>
        PlaylistSong.create({ playlist_id: playlistId, song_id: song_id }),
      ),
    );

    return playlistSongs.map((s) => s.toJSON());

  } catch (err) {
    throw err;
  }
}

async function getPlaylistSongs(
  playlistId: number,
  page: number = 1,
  limit: number = 10,
  user_id?: number
) {
  const offset = (page - 1) * limit;

  const { rows, count } = await PlaylistSong.findAndCountAll({
    where: { playlist_id: playlistId },
    limit,
    offset,
    order: [["playlist_song_id", "DESC"]],
   include: [
  {
    model: song,
    as: "song",
    attributes: ["song_id", "title", "thumbnail", "audio"],
    include: [
      {
        model: favorites,
        as: "downloadedBy",
        attributes: [],
        required: false,
        where: user_id ? { user_id } : undefined,
      },
      {
        model: Downloads,
        as: "favoriteBy",
        attributes: [],
        required: false,
        where: user_id ? { user_id } : undefined,
      },
    ],
  },
],
  });

  const songs = rows.map((item: any) => {
    const s = item.song;

    return {
      song_id: s.song_id,
      title: s.title,
      thumbnail: s.thumbnail,
      audio: s.audio,
      is_favorite: s.favoriteBy?.length > 0,
      is_downloaded: s.downloadedBy?.length > 0,
    };
  });

  return {
    songs,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

export default {
  createAlbum,
  addSongsToAlbum,
  removeSongFromAlbum,
  updateAlbum,
  getAlbum,
  getAlbumData,
  addToPlaylistSearchHistory,
  removeFromPlaylistSearchHistory,
  getPlaylistSearchHistory,
  getAllAlbums,
  searchPlaylist,
  isfavorite,
  setfavorite,
  getMyAlbums,
  getFavoriteAlbums,
  searchFavoriteAlbums,
  deleteAlbum,
  getAlbumSongs,
  createPlaylist,
  addSongsToPlaylist,
  getPlaylist,
  removeSongFromPlaylist,
  getMyPlaylists,
  getPlaylistSongs,
  deletePlaylist,
  getAlbumWithSongs,
};
