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
} from "../controllers/album.controller";
import { addSongsToAlbum } from "../controllers/album.controller";
import z from "zod";
import { createAlbumSchema } from "../zod/album.validator";

const router = Router();

router.post(
  "/get",
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  getAlbum,
);
router.post(
  "/favorite",
  authenticate,
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  setfavorite,
);

router.post(
  "/create-playlist",
  authenticate,
  validateBody(createAlbumSchema),
  createAlbum,
);

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

router.post("/search-playlist",
  authenticate,
  validateBody(
    z.object({
      search: z.string().min(1, "search is required."),
      page: z.number().optional(),
      limit: z.number().optional(),
    })
  ),
  searchPlaylist
)
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
    z.object({ page: z.string().optional(), limit: z.string().optional() }),
  ),
  getPlaylistSearchHistory,
);
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
router.post(
  "/get-favorite-albums",
  authenticate,
  validateBody(
    z.object({ page: z.string().optional(), limit: z.string().optional() }),
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
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  ),
  searchFavoriteAlbums,
);

router.post(
  "/delete-album",
  authenticate,
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") }),
  ),
  deleteAlbum,
);

export default router;
