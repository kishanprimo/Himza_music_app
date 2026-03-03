import { authenticate } from "../middleware/auth.middleware";
import { Router } from "express";
import { validateBody } from "../middleware/zod.middleware";
import {
  getAlbum,
  setfavorite,
  createAlbum,
  getMyAlbums,
  getFavoriteAlbums,
  removeSongsFromAlbum,
  deleteAlbum,
  searchFavoriteAlbums,
  getPlaylistSearchHistory,
  addPlaylistSearchHistory,
  removePlaylistSearchHistory,
  searchPlaylist,
  getAlbumSongs,
  addSongsToAlbum, // ✅ proper import
} from "../controllers/album.controller";
import z from "zod";
import { createAlbumSchema } from "../zod/album.validator";

const router = Router();

// get album
router.post(
  "/get",
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  getAlbum,
);

// set favorite
router.post(
  "/favorite",
  authenticate,
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  setfavorite,
);

// create album
router.post(
  "/create-playlist",
  authenticate,
  validateBody(createAlbumSchema),
  createAlbum,
);

// add songs to playlist
router.post(
  "/add-songs-to-playlist",
  authenticate,
  validateBody(
    z.object({
      album_id: z.string().min(1, "album_id is required."),
      song_ids: z.array(z.string()).min(1, "song_id is required."),
    }),
  ),
  addSongsToAlbum,
);

// remove songs from playlist
router.post(
  "/remove-songs-from-playlist",
  authenticate,
  validateBody(
    z.object({
      album_id: z.string().min(1, "album_id is required."),
      song_ids: z.array(z.string()).min(1, "song_id is required."),
    }),
  ),
  removeSongsFromAlbum,
);

// search playlist
router.post(
  "/search-playlist",
  authenticate,
  validateBody(
    z.object({
      search: z.string().min(1, "search is required."),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    })
  ),
  searchPlaylist
);

// playlist search history
router.post(
  "/add-playlist-search-history",
  authenticate,
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  addPlaylistSearchHistory,
);
router.post(
  "/remove-playlist-search-history",
  authenticate,
  validateBody(
    z.object({
      search_id: z.coerce.number().int().positive(),
    }),
  ),
  removePlaylistSearchHistory,
);
router.post(
  "/get-playlist-search-history",
  authenticate,
  validateBody(
    z.object({ page: z.coerce.number().optional(), limit: z.coerce.number().optional() }),
  ),
  getPlaylistSearchHistory,
);

// get my albums
router.post(
  "/get-my-playlist",
  authenticate,
  validateBody(
    z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    }),
  ),
  getMyAlbums,
);

// get favorite albums
router.post(
  "/get-favorite-albums",
  authenticate,
  validateBody(
    z.object({ page: z.coerce.number().optional(), limit: z.coerce.number().optional() }),
  ),
  getFavoriteAlbums,
);

// search favorite albums
router.post(
  "/search-favorite-albums",
  authenticate,
  validateBody(
    z.object({
      search: z.string().min(1, "search is required."),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    }),
  ),
  searchFavoriteAlbums,
);

// delete album
router.post(
  "/delete-album",
  authenticate,
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  deleteAlbum,
);

// get album songs
router.post(
  "/get-album-songs",
  authenticate,
  validateBody(
    z.object({
      album_id: z.coerce.number(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    })
  ),
  getAlbumSongs, // ✅ use the correct controller function
);

export default router;