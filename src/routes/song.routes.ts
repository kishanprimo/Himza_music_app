import { authenticate } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  getSong,
  setfavorite,
  setDownloaded,
  getMySongs,
  getNextSong,
  getfavoriteSongs,
  searchFavoriteSongs,
  getAllSongs,
  getDownloadedSongs,
  getTrendingSongs,
  deleteSong,
  searchDownloadedSongs
} from "../controllers/song.controller";
import { uploadMusicSchema, updateMusicSchema } from "../zod/song.validator";
import { validateBody } from "../middleware/zod.middleware";
import { paginationSchema } from "../zod/pagenation.validator";
import z from "zod";
import { optionalAuth } from "../middleware/optionalAuth.middleware";
const router = Router();

router.post(
  "/get-trending-songs",
  validateBody(paginationSchema),
  getTrendingSongs,
);

router.post(
  "/all-songs",
  optionalAuth,
  validateBody(
    z.object({
      album_id: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().optional(),
    }),
  ),
  getAllSongs,
);

router.get("/next-song", getNextSong);

router.use(authenticate);
router.post(
  "/get",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") }),
  ),
  getSong,
);
router.post(
  "/",
  validateBody(
    z.object({
      artist_id: z.string(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  ),
  getMySongs,
);
router.post(
  "/favorite",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") }),
  ),
  setfavorite,
);
// search favorite songs
router.post(
  "/search-favorite-songs",
  validateBody(
    z.object(
      { search: z.string().min(1, "search is required") },
      z.object({ page: z.string().optional(), limit: z.string().optional() }),
    ),
  ),
  searchFavoriteSongs,
);
// search downloaded songs 
router.post(
  "/search-downloaded-songs",
  validateBody(
    z.object(
      { search: z.string().min(1, "search is required") },
      z.object({ page: z.string().optional(), limit: z.string().optional() }),
    ),
  ),
  searchDownloadedSongs,
);
router.post(
  "/download",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") }),
  ),
  setDownloaded,
);

router.post(
  "/get-favorite-songs",
  validateBody(paginationSchema),
  getfavoriteSongs,
);
router.post(
  "/get-downloaded-songs",
  validateBody(paginationSchema),
  getDownloadedSongs,
);

export default router;
