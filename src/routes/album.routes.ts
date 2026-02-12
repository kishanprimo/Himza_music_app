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
router.get("/get-my-albums", authenticate, getMyAlbums);
router.post(
  "/get-favorite-albums",
  authenticate,
  validateBody(
    z.object({ page: z.string().optional(), limit: z.string().optional() }),
  ),
  getFavoriteAlbums,
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
