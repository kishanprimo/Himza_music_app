import { Request, Response } from "express";
import { album_service, response_service } from "../services";
import { logger } from "../utils";
import { config } from "../config";
import fs from "fs";
import db from "../models";

const {
  AlbumSong,
  Genre,
  Movie,
  MovieSongConnection,
  MusicSinger,
  song,
  User,
  PlaylistSong,
} = db;

// create album =============================================
async function createAlbum(req: Request, res: Response) {

  try {
    const user = req.user;
    const is_private = req.body.is_private;
    // if (is_private != "true" && !req.user.admin_id)
    //   return response_service.badRequestResponse(
    //     res,
    //     "Only admins can create public albums."
    //   );
    if (is_private == "true" && !req.user.user_id)
      return response_service.badRequestResponse(
        res,
        "You cannot create private albums."
      );

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    let songs = req.body.songs;

    // if (songs.length <= 0) return response_service.badRequestResponse(res, 'You can add only your own songs.');
    let album_data;

    if (user.user_id) {
      album_data = {
        ...req.body,
        thumbnail: files?.["album_thumbnail"]?.[0].path,
        user_id: req.user.user_id,
      };
    } else {
      album_data = {
        ...req.body,
        thumbnail: files?.["album_thumbnail"]?.[0].path,
      };
    }
    const album = await album_service.createAlbum(album_data);
    if (!album)
      return response_service.badRequestResponse(
        res,
        "Failed to create album."
      );
    if (songs) await album_service.addSongsToAlbum(songs, album.album_id);
    return response_service.successResponse(
      res,
      "Album created successfully.",
      album
    );
  } catch (err: any) {
    logger.error("Error creating album:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function createPlaylist(req: Request, res: Response) {

  try {
    const user = req.user;
    const is_private = req.body.is_private;

    if (is_private == "true" && !req.user.user_id)
      return response_service.badRequestResponse(
        res,
        "You cannot create private playlists."
      );

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    let songs = req.body.songs;

    let playlist_data;

    if (user.user_id) {
      playlist_data = {
        ...req.body,
        thumbnail: files?.["playlist_thumbnail"]?.[0].path,
        user_id: req.user.user_id,
      };
    } else {
      playlist_data = {
        ...req.body,
        thumbnail: files?.["playlist_thumbnail"]?.[0].path,
      };
    }

    const playlist = await album_service.createPlaylist(playlist_data);

    if (!playlist)
      return response_service.badRequestResponse(
        res,
        "Failed to create playlist."
      );

    if (songs)
      await album_service.addSongsToPlaylist(songs, playlist.playlist_id);

    return response_service.successResponse(
      res,
      "Playlist created successfully.",
      playlist
    );

  } catch (err: any) {
    logger.error("Error creating playlist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// Add songs to album =====================================================
async function addSongsToAlbum(req: Request, res: Response) {
  try {
    let album;
    album = await album_service.getAlbum(
      { album_id: req.body.album_id },
      [
        {
          model: AlbumSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
              attributes: ["song_id"],
            },
          ],
        },
      ]
    );

    if (!album) {
      return response_service.badRequestResponse(
        res,
        "Album not found."
      );
    }
    let existing_songs = album.songs?.map((song: any) =>
      song.song_id.toString()
    );
    let songs = req.body.songIds || req.body.song_ids;
    existing_songs = album.songs?.filter((song: any) =>
      songs.includes(song.song_id.toString())
    );

    if (existing_songs?.length > 0)
      return response_service.badRequestResponse(
        res,
        "You can add only unique songs."
      );

    songs = await album_service.addSongsToAlbum(songs, req.body.album_id);
    if (!songs)
      return response_service.badRequestResponse(
        res,
        "Failed to add songs to album."
      );
    return response_service.successResponse(
      res,
      "Songs added to album successfully.",
      await album_service.getAlbum({ album_id: req.body.album_id }, [
        {
          model: AlbumSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
            },
          ],
        },
      ])
    );
  } catch (err: any) {
    logger.error("Error adding songs to album:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}
async function addSongsToPlaylist(req: Request, res: Response) {
  try {
    let user = req.user;
    let playlist;

    if (user.user_id) {
      playlist = await album_service.getPlaylist(
        {
          playlist_id: req.body.playlist_id,
          user_id: req.user.user_id,
          is_private: true,
        },
        [
          {
            model: PlaylistSong,
            as: "songs",
            include: [
              {
                model: song,
                as: "song",
                attributes: ["song_id"],
              },
            ],
          },
        ]
      );
    } else {
      playlist = await album_service.getPlaylist(
        { playlist_id: req.body.playlist_id, is_private: false },
        [
          {
            model: PlaylistSong,
            as: "songs",
            include: [
              {
                model: song,
                as: "song",
                attributes: ["song_id"],
              },
            ],
          },
        ]
      );
    }

    if (!playlist)
      return response_service.badRequestResponse(res, "Playlist not found.");

    let songs = req.body.songIds || req.body.song_ids;

    // check duplicate songs
    let existing_songs =
      playlist.songs?.filter((s: any) => songs.includes(s.song_id.toString())) || [];

    if (existing_songs.length > 0)
      return response_service.badRequestResponse(
        res,
        `Song is already in the "${playlist.title}".`
      );

    const addedSongs = await album_service.addSongsToPlaylist(
      songs,
      req.body.playlist_id
    );

    if (!addedSongs)
      return response_service.badRequestResponse(
        res,
        "Failed to add songs to playlist."
      );

    return response_service.successResponse(
      res,
      "Songs added to playlist successfully.",
      await album_service.getPlaylist({ playlist_id: req.body.playlist_id }, [
        {
          model: PlaylistSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
            },
          ],
        },
      ])
    );
  } catch (err: any) {
    logger.error("Error adding songs to playlist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// remove song from album ==================================================
async function removeSongsFromAlbum(req: Request, res: Response) {
  try {
    let user = req.user;
    let album;
    if (user.user_id) {
      album = await album_service.getAlbum({
        album_id: req.body.album_id,
        user_id: req.user.user_id,
      });
    } else {
      album = await album_service.getAlbum({ album_id: req.body.album_id });
    }

    if (!album)
      return response_service.badRequestResponse(res, "Album not found.");
    let songs = req.body.songIds || req.body.song_ids;
    songs = await album_service.removeSongFromAlbum(songs, req.body.album_id);

    if (songs && songs[0] == 0)

      return response_service.badRequestResponse(
        res,
        "Failed to remove songs from album."
      );

    return response_service.successResponse(
      res,
      "Songs removed from album successfully.",
      await album_service.getAlbum({ album_id: req.body.album_id }, [
        {
          model: AlbumSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
            },
          ],
        },
      ])
    );
  } catch (err: any) {
    logger.error("Error adding songs to album:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function removeSongsFromPlaylist(req: Request, res: Response) {

  try {
    let user = req.user;
    let playlist;

    if (user.user_id) {
      playlist = await album_service.getPlaylist({
        playlist_id: req.body.playlist_id,
        user_id: req.user.user_id,
      });
    } else {
      playlist = await album_service.getPlaylist({
        playlist_id: req.body.playlist_id,
      });
    }

    if (!playlist)
      return response_service.badRequestResponse(res, "Playlist not found.");

    let songs = req.body.songIds || req.body.song_ids;

    songs = await album_service.removeSongFromPlaylist(
      songs,
      req.body.playlist_id
    );

    if (songs && songs[0] == 0)
      return response_service.badRequestResponse(
        res,
        "Failed to remove songs from playlist."
      );

    return response_service.successResponse(
      res,
      "Songs removed from playlist successfully.",
      await album_service.getPlaylist({ playlist_id: req.body.playlist_id }, [
        {
          model: PlaylistSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
            },
          ],
        },
      ])
    );
  } catch (err: any) {
    logger.error("Error removing songs from playlist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// search in playlist ================================================
export async function searchPlaylist(req: Request, res: Response) {

  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return response_service.unauthorizedResponse(
        res,
        "User not authenticated."
      );
    }

    const search = req.body.search as string;
    const page = parseInt(req.body.page as string) || 1;
    const limit = parseInt(req.body.limit as string) || 10;

    const result = await album_service.searchPlaylist(
      userId,
      search,
      page,
      limit
    );

    return response_service.successResponse(
      res,
      "Playlist search fetched successfully.",
      result
    );
  } catch (err: any) {
    logger.error("Error searching playlist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

export async function addPlaylistSearchHistory(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.user_id;
    const albumId = parseInt(req.body.album_id);

    if (!userId) {
      return response_service.unauthorizedResponse(
        res,
        "User not authenticated."
      );
    }

    const result = await album_service.addToPlaylistSearchHistory(
      userId,
      albumId
    );

    return response_service.successResponse(
      res,
      "Playlist added to search history.",
      result
    );
  } catch (err: any) {
    return response_service.internalServerErrorResponse(res, err.message);
  }
}
export async function removePlaylistSearchHistory(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return response_service.unauthorizedResponse(
        res,
        "User not authenticated."
      );
    }

    const searchId = req.body.search_id;

    if (!searchId || isNaN(searchId)) {
      return response_service.badRequestResponse(
        res,
        "Valid search_id is required."
      );
    }

    const deleted = await album_service.removeFromPlaylistSearchHistory(
      userId,
      searchId
    );

    if (!deleted) {
      return response_service.notFoundResponse(
        res,
        "History not found."
      );
    }

    return response_service.successResponse(
      res,
      "Playlist removed from search history.",
      null
    );
  } catch (err: any) {
    return response_service.internalServerErrorResponse(res, err.message);
  }
}
export async function getPlaylistSearchHistory(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return response_service.unauthorizedResponse(
        res,
        "User not authenticated."
      );
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await album_service.getPlaylistSearchHistory(
      userId,
      page,
      limit
    );

    return response_service.successResponse(
      res,
      "Playlist search history fetched successfully.",
      result
    );
  } catch (err: any) {
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// update album ====================================================
async function updateAlbum(req: Request, res: Response) {
  try {
    const { album_id, song_id } = req.body;

    let album = await album_service.getAlbum({ album_id });

    if (!album) {
      return response_service.badRequestResponse(
        res,
        "Album not found."
      );
    }

    if (album.is_private && req.user.user_id) {
      return response_service.badRequestResponse(res, "");
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    let del_album;

    if (files?.["album_thumbnail"]) {
      del_album = album.thumbnail;
    }

    // Update album details only when provided
    const album_data: any = {
      ...req.body,
    };

    // Do not save song_id in the Album table
    delete album_data.song_id;

    // Preserve the existing thumbnail when no new file is uploaded
    if (files?.["album_thumbnail"]?.[0]) {
      album_data.thumbnail =
        files["album_thumbnail"][0].path;
    }

    album = await album_service.updateAlbum(
      album_data,
      { album_id }
    );

    if (!album) {
      return response_service.badRequestResponse(
        res,
        "Failed to update album."
      );
    }

    // Link song with album through AlbumSong
    if (song_id && song_id.length > 0) {
      await album_service.linkSongsToAlbum(
        album_id,
        song_id
      );
    }

    // Fetch updated album with songs and genre
    album = await album_service.getAlbum(
      { album_id },
      [
        {
          model: AlbumSong,
          as: "songs",
          include: [
            {
              model: song,
              as: "song",
            },
          ],
        },
        {
          model: Genre,
          as: "albumGenre",
        },
      ]
    );

    if (del_album) {
      const del_album_path = del_album.replace(
        config.clientUrl,
        ""
      );

      if (fs.existsSync(del_album_path)) {
        fs.unlinkSync(del_album_path);
      }
    }

    return response_service.successResponse(
      res,
      song_id?.length
        ? "Album updated and songs linked successfully."
        : "Album updated successfully.",
      album
    );
  } catch (err: any) {
    logger.error("Error updating album:", err);

    if (err.message === "Song not found.") {
      return response_service.badRequestResponse(
        res,
        err.message
      );
    }

    return response_service.internalServerErrorResponse(
      res,
      err.message
    );
  }
}

// get album =================================================
async function getAlbum(req: Request, res: Response) {
  try {
    const user = req.user;
    let albumData = await album_service.getAlbum({
      album_id: req.body.album_id,
    });
    let is_album_liked = false;
    if (user?.user_id) {
      is_album_liked = await album_service.isfavorite(
        user.user_id,
        req.body.album_id
      );
    }

    const album = await album_service.getAlbumData(
      { album_id: req.body.album_id },
      user ? user.user_id : null,
      [
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
      ]
    );

    // if (!album) return response_service.badRequestResponse(res, 'You are not the owner of this album.');
    // if (!album.is_private || album.user_id == req.user.user_id) {
    // }
    return response_service.successResponse(
      res,
      "Album fetched successfully.",
      { album: { ...albumData, is_album_liked }, album_data: album }
    );
  } catch (err: any) {
    logger.error("Error fetching album:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get all albums ========================================
async function getAllAlbums(req: Request, res: Response) {
  try {
    const albums = await album_service.getAllAlbums(
      req.body.page,
      req.body.limit,
      req.body.sort_by,
      req.body.sort_order
    );
    if (!albums)
      return response_service.notFoundResponse(res, "Albums not found.");
    return response_service.successResponse(
      res,
      "Albums fetched successfully.",
      albums
    );
  } catch (err: any) {
    logger.error("Error fetching albums:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getAlbumDetails(req: Request, res: Response) {
  try {
    const album_id = parseInt(req.body.album_id);

    const album = await album_service.getAlbumWithSongs(album_id);

    if (!album)
      return response_service.notFoundResponse(res, "Album not found.");

    return response_service.successResponse(
      res,
      "Album details retrieved successfully.",
      album
    );
  } catch (err: any) {
    logger.error("Error getting album details:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// set favorites =========================================
async function setfavorite(req: Request, res: Response) {
  try {
    const user = req.user;
    const albumId = req.body.album_id;
    const song = await album_service.getAlbum({
      album_id: albumId,
    });
    if (!song)
      return response_service.notFoundResponse(res, "Album not found.");
    const isfavorite = await album_service.setfavorite(user.user_id, albumId);
    return response_service.successResponse(
      res,
      `Album marked as favorite: ${isfavorite}.`
    );
  } catch (err: any) {
    logger.error("Error setting favorite:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get particular user albums ===========================================
async function getMyAlbums(req: Request, res: Response) {
  try {
    const user = req.user;
    const albums = await album_service.getMyAlbums(user.user_id, req.body.page,
      req.body.limit);
    if (!albums)
      return response_service.notFoundResponse(res, "Albums not found.");
    return response_service.successResponse(
      res,
      "Albums fetched successfully.",
      albums
    );
  } catch (err: any) {
    logger.error("Error fetching albums:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getMyPlaylists(req: Request, res: Response) {
  try {
    const user = req.user;

    const playlists = await album_service.getMyPlaylists(
      user.user_id,
      req.body.page,
      req.body.limit
    );

    if (!playlists)
      return response_service.notFoundResponse(res, "Playlists not found.");

    return response_service.successResponse(
      res,
      "Playlists fetched successfully.",
      playlists
    );
  } catch (err: any) {
    logger.error("Error fetching playlists:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}




// get fav albums =============================================
async function getFavoriteAlbums(req: Request, res: Response) {

  try {
    const user = req.user;
    const albums = await album_service.getFavoriteAlbums(
      user.user_id,
      req.body.page,
      req.body.limit
    );
    if (!albums)
      return response_service.notFoundResponse(res, "Albums not found.");
    return response_service.successResponse(
      res,
      "Albums fetched successfully.",
      albums
    );
  } catch (err: any) {
    logger.error("Error fetching albums:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// search from favorite album list ========================================
// search favorite albums =============================================
async function searchFavoriteAlbums(req: Request, res: Response) {

  try {
    const user = req.user;

    const search: string = req.body.search;
    const page: number = parseInt(req.body.page) || 1;
    const limit: number = parseInt(req.body.limit) || 10;

    const result = await album_service.searchFavoriteAlbums(
      user.user_id,
      search,
      page,
      limit
    );

    if (!result)
      return response_service.notFoundResponse(
        res,
        "Albums not found."
      );

    return response_service.successResponse(
      res,
      "Albums fetched successfully.",
      result
    );
  } catch (err: any) {
    logger.error("Error searching favorite albums:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}


// delete album =====================================
async function deleteAlbum(req: Request, res: Response) {
  try {
    const albumId = req.body.album_id;
    const album = await album_service.getAlbum({
      album_id: albumId,
    });
    if (!album)
      return response_service.notFoundResponse(res, "Album not found.");
    if (album.user_id != req.user.user_id && !req.user.admin_id)
      return response_service.badRequestResponse(
        res,
        "You are not the owner of this album."
      );
    const result = await album_service.deleteAlbum(albumId);
    if (!result)
      return response_service.badRequestResponse(
        res,
        "Failed to delete album."
      );
    return response_service.successResponse(res, "Album deleted successfully.");
  } catch (err: any) {
    logger.error("Error deleting album:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function deletePlaylist(req: Request, res: Response) {
  try {
    const playlistId = req.body.playlist_id;

    const playlist = await album_service.getPlaylist({
      playlist_id: playlistId,
    });

    if (!playlist)
      return response_service.notFoundResponse(res, "Playlist not found.");

    if (playlist.user_id != req.user.user_id && !req.user.admin_id)
      return response_service.badRequestResponse(
        res,
        "You are not the owner of this playlist."
      );

    const result = await album_service.deletePlaylist(playlistId);

    if (!result)
      return response_service.badRequestResponse(
        res,
        "Failed to delete playlist."
      );

    return response_service.successResponse(
      res,
      "Playlist deleted successfully."
    );
  } catch (err: any) {
    logger.error("Error deleting playlist:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getAlbumSongs(req: Request, res: Response) {
  try {
    const { album_id, page = 1, limit = 10 } = req.body;
    const user_id = req.user?.user_id;

    const songs = await album_service.getAlbumSongs(
      Number(album_id),
      Number(page),
      Number(limit),
      user_id
    );

    return response_service.successResponse(
      res,
      "Album songs fetched successfully",
      songs || { songs: [], total: 0 }
    );
  } catch (err: any) {
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

async function getPlaylistSongs(req: Request, res: Response) {
  try {
    const { playlist_id, page = 1, limit = 10 } = req.body;
    const user_id = req.user?.user_id;

    const songs = await album_service.getPlaylistSongs(
      Number(playlist_id),
      Number(page),
      Number(limit),
      user_id
    );

    return response_service.successResponse(
      res,
      "Playlist songs fetched successfully",
      songs || { songs: [], total: 0 }
    );
  } catch (err: any) {
    return response_service.internalServerErrorResponse(res, err.message);
  }
}





export {
  createAlbum,
  updateAlbum,
  addSongsToAlbum,
  removeSongsFromAlbum,
  getAlbum,
  getAllAlbums,
  setfavorite,
  getMyAlbums,
  getFavoriteAlbums,
  searchFavoriteAlbums,
  deleteAlbum,
  getAlbumSongs,
  createPlaylist,
  addSongsToPlaylist,
  removeSongsFromPlaylist,
  getMyPlaylists,
  getPlaylistSongs,
  deletePlaylist,
  getAlbumDetails,
};

