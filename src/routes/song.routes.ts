import { authenticate } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  getSong,
  setfavorite,
  setDownloaded,
  getMySongs,
  getNextSong,
  getfavoriteSongs,
  getAllSongs,
  getDownloadedSongs,
  getTrendingSongs,
  deleteSong,
} from "../controllers/song.controller";
import { uploadMusicSchema, updateMusicSchema } from "../zod/song.validator";
import { validateBody } from "../middleware/zod.middleware";
import { paginationSchema } from "../zod/pagenation.validator";
import z from "zod";
const router = Router();

router.post(
  "/get-trending-songs",
  validateBody(paginationSchema),
  getTrendingSongs
);

router.post(
  "/all-songs",
  validateBody(
    z.object({
      album_id: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
    })
  ),
  getAllSongs
);

router.get("/next-song", getNextSong);
router.post(
  "/get",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") })
  ),
  getSong
);

router.use(authenticate);
router.post(
  "/",
  validateBody(
    z.object({
      artist_id: z.string(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
  ),
  getMySongs
);
router.post(
  "/favorite",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") })
  ),
  setfavorite
);
router.post(
  "/download",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") })
  ),
  setDownloaded
);

router.post(
  "/get-favorite-songs",
  validateBody(paginationSchema),
  getfavoriteSongs
);
router.post(
  "/get-downloaded-songs",
  validateBody(paginationSchema),
  getDownloadedSongs
);

export default router;
