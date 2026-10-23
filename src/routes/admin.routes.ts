import { authenticateAdmin } from "../middleware/auth.middleware";
import { optionalAdminAuth } from "../middleware/optionalAuth.middleware";
import { Router } from "express";
import { Request, Response, NextFunction } from "express";

import { validateBody } from "../middleware/zod.middleware";
import {
  adminLoginSchema,
  adminUpdateSchema,
} from "../zod/admin.auth.validator";
import {
  changePassword,
  updateAdmin,
  verifyAdmin,
} from "../controllers/admin.auth.controller";
import z from "zod";
import {
  dashboardCountCards,
  getAllUsersList,
  getCount,
  getUser,
  updateUserAdmin,
  usersByLogin,
  getPlatformStatistics,
} from "../controllers/dashboard.controller";
import {
  addBlockSchema,
  updateBlockDataSchema,
  updateBlockSchema,
} from "../zod/home.validator";
import {
  createBlock,
  addDataToBlock,
  deleteBlock,
  removeDataFromBlock,
  updateBlock,
  reorderBlocks,
} from "../controllers/home.controller";
import { updateMusicSchema, uploadMusicSchema } from "../zod/song.validator";
import {
  createMusic,
  deleteSong,
  getDownloadedSongs,
  getfavoriteSongs,
  getMySongs,
  updateSong,
} from "../controllers/song.controller";
import {
  createArtist,
  deleteArtist,
  getArtists,
  updateArtist,
  getArtist,
} from "../controllers/artist.auth.controller";
import { updateUserSchema } from "../zod/user.validator";
import { SigninSchema } from "../zod/auth.validator";
import {
  CreateGenreSchema,
  updateGenreSchema,
} from "../zod/genre.category.validator";
import {
  createGenre,
  getGenreAdmin,
  removeGenre,
  updateGenre,
} from "../controllers/genre.controller";
import {
  addOrRemoveSongsFromAlbumSchema,
  createAlbumSchema,
  updateAlbumSchema,
} from "../zod/album.validator";
import {
  addSongsToAlbum,
  createAlbum,
  deleteAlbum,
  getAllAlbums,
  removeSongsFromAlbum,
  updateAlbum,
  getAlbumDetails,
} from "../controllers/album.controller";
import {
  addSongsToMovie,
  createMovie,
  deleteMovie,
  removeSongsFromMovie,
  updateMovie,
} from "../controllers/movie.controller";
import {
  addOrRemoveSongsFromMovieSchema,
  createMovieSchema,
  updateMovieSchema,
} from "../zod/movie.validator";
import {
  createConfig,
  getConfig,
  updateConfig,
} from "../controllers/config.controller";
import {
  createPlan,
  deletePlan,
  getUserSubscriptions,
  updatePlan,
} from "../controllers/subscription.controller";
import { paginationSchema } from "../zod/pagenation.validator";
import { getAdsForAdmin, deleteAd } from "../controllers/ad.controller";
import { createPodcast, getAllPodcast, editPodcast, getPodcastById, deletePodcast } from "../controllers/podcast.controller";
import { addEpisode, getEpisodeList, editEpisode, deleteEpisode } from "../controllers/episode.controller"
import { addEpisodeSchema, deleteEpisodeSchema, editPodcastSchema } from "../zod/podcast.validator";
import { broadcastMessage, getbroadcastMessage } from "../controllers/Pushnotification.controller";
import { broadcastMessageSchema, getBroadcastMessageSchema } from "../zod/broadcast.validator";

const router = Router();

router.post("/login", validateBody(adminLoginSchema), verifyAdmin);
router.get("/config", optionalAdminAuth, getConfig);

router.use(authenticateAdmin);

router.post("/change-password", changePassword);
router.post("/update", validateBody(adminUpdateSchema), updateAdmin);
router.post(
  "/count",
  validateBody(
    z.object({
      filter_by: z.enum(["day", "week", "month", "year", "total"]),
      entity: z.enum([
        "users",
        "artists",
        "albums",
        "songs",
        "movies",
        "genre",
      ]),
    })
  ),
  getCount
);
router.post("/all-users", getAllUsersList);
router.post("/get-user", getUser);
router.post("/update-user", updateUserAdmin);
router.get("/users-by-login", usersByLogin);
router.post(
  "/dashboard-counts",
  validateBody(
    z.object({
      entity: z.enum(["users", "earnings", "albums", "songs"]),
    })
  ),
  dashboardCountCards
);

// Platform Statistics Dashboard API
router.post("/platform-statistics", getPlatformStatistics);

const parseArrayFields = (req: Request,
  res: Response,
  next: NextFunction) => {
  const fields = ["artist_ids", "genre_ids", "song_ids", "album_ids"];

  fields.forEach((field) => {
    if (typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch {
        req.body[field] = [];
      }
    }
  });

  next();
};
router.post("/create-block", parseArrayFields, validateBody(addBlockSchema), createBlock);
router.post("/update-block", parseArrayFields, validateBody(updateBlockSchema), updateBlock);
router.post(
  "/add-data-to-block",
  validateBody(updateBlockDataSchema),
  addDataToBlock
);
router.post(
  "/remove-data-from-block",
  validateBody(updateBlockDataSchema),
  removeDataFromBlock
);
router.post("/delete-block", deleteBlock);

router.post("/reorder-blocks", reorderBlocks);

const parseUploadMusicFields = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const artistIds = req.body.artist_ids;

  if (artistIds !== undefined) {
    if (Array.isArray(artistIds)) {
      req.body.artist_ids = artistIds.map(String);
    } else if (typeof artistIds === "string") {
      req.body.artist_ids = [artistIds];
    }
  }

  const albumIds = req.body.album_ids;

  if (albumIds !== undefined) {
    if (Array.isArray(albumIds)) {
      req.body.album_ids = albumIds.map(String);
    } else if (typeof albumIds === "string") {
      req.body.album_ids = [albumIds];
    }
  }

  next();
};

router.post("/upload-song", parseUploadMusicFields, validateBody(uploadMusicSchema), createMusic);
router.post("/update-song", validateBody(updateMusicSchema), updateSong);
router.post(
  "/delete-song",
  validateBody(
    z.object({ song_id: z.string().min(1, "song_id is required.") })
  ),
  deleteSong
);

const parseGenreIds = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (typeof req.body.genre_ids === "string") {
    try {
      req.body.genre_ids = JSON.parse(req.body.genre_ids);
    } catch {
      req.body.genre_ids = [];
    }
  }
  next();
};




router.post(
  "/create-artist",
  parseGenreIds,
  validateBody(
    z.object({
      full_name: z.string(),
      genre_ids: z.array(z.string()),
      description: z.string(),
    })
  ),
  createArtist
);

router.post("/update-artist", validateBody(updateUserSchema), updateArtist);
router.post(
  "/get-all-artists",
  validateBody(
    z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      user_name: z.string().optional(),
      sort_by: z.string().optional(),
      sort_order: z.string().optional(),
    })
  ),
  getArtists
);
router.post(
  "/delete-artist",
  validateBody(
    z.object({ user_id: z.string().min(1, "user_id is required.") })
  ),
  deleteArtist
);

router.post(
  "/artist-profile",
  validateBody(
    z.object({ artist_id: z.string().min(1, "artist_id is required.") })
  ),
  getArtist
);;

router.post("/create-genre", validateBody(CreateGenreSchema), createGenre);
router.post(
  "/get-all-genre",
  validateBody(
    z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      sort_by: z.string().optional(),
      sort_order: z.string().optional(),
    })
  ),
  getGenreAdmin
);

router.post("/update-genre", validateBody(updateGenreSchema), updateGenre);
router.post(
  "/delete-genre",
  validateBody(
    z.object({ genre_id: z.string().min(1, "genre_id is required.") })
  ),
  removeGenre
);

router.post("/create-album", validateBody(createAlbumSchema), createAlbum);
// Admin panel sends song_id as a JSON string in multipart form data.
const parseAlbumSongIds = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (typeof req.body.song_id === "string") {
    try {
      const parsed = JSON.parse(req.body.song_id);

      if (Array.isArray(parsed)) {
        req.body.song_id = parsed.map(String);
      }
    } catch {
      // Invalid input will be rejected by Zod
    }
  }

  next();
};

router.post(
  "/update-album",
  parseAlbumSongIds,
  validateBody(updateAlbumSchema),
  updateAlbum
);
router.post(
  "/add-Songs-to-album",
  validateBody(addOrRemoveSongsFromAlbumSchema),
  addSongsToAlbum
);
router.post(
  "/delete-album",
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") })
  ),
  deleteAlbum
);
router.post(
  "/remove-Songs-from-album",
  validateBody(addOrRemoveSongsFromAlbumSchema),
  removeSongsFromAlbum
);
router.post("/get-all-albums", getAllAlbums);

router.post(
  "/get-album-details",
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") })
  ),
  getAlbumDetails
);

router.post("/create-movie", validateBody(createMovieSchema), createMovie);
router.post("/update-movie", validateBody(updateMovieSchema), updateMovie);
router.post("/delete-movie", deleteMovie);
router.post(
  "/add-songs-to-movie",
  validateBody(addOrRemoveSongsFromMovieSchema),
  addSongsToMovie
);
router.post(
  "/remove-songs-from-movie",
  validateBody(addOrRemoveSongsFromMovieSchema),
  removeSongsFromMovie
);

router.post("/create-config", createConfig);
router.post("/update-config", updateConfig);

router.post("/create-subscription-plan", createPlan);
router.post("/update-subscription-plan", updatePlan);
router.post("/delete-subscription-plan", deletePlan);

router.post("/get-user-subscriptions", getUserSubscriptions);

router.post(
  "/user-profile",
  validateBody(
    z.object({ user_id: z.string().min(1, "user_id is required.") })
  ),
  getUser
);
router.post(
  "/get-user-favorite-songs",
  validateBody(
    z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      user_id: z.string().min(1, "user_id is required."),
    })
  ),
  getfavoriteSongs
);
router.post(
  "/get-user-downloaded-songs",
  validateBody(
    z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      user_id: z.string().min(1, "user_id is required."),
    })
  ),
  getDownloadedSongs
);

router.post(
  "/get-song-by-artist",
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
  "/get-ads",
  validateBody(
    z.object({
      type: z.string(),
      page: z.string().optional(),
      limit: z.string().optional(),
      search_by: z.string().optional(),
      search_order: z.string().optional(),
      search_term: z.string().optional(),
    })
  ),
  getAdsForAdmin
);

// router.post("/get-user-subscriptions", getUserSubscriptions);

// to delete ad from list ================================
router.post(
  "/delete-ad",
  validateBody(z.object({ ad_id: z.string().min(1, "ad_id is required") })),
  deleteAd
);

// routers for podacst ===============================
router.post("/create-podcast", createPodcast)
router.post("/get-podcast-list", getAllPodcast)
router.post("/edit-podcast", validateBody(editPodcastSchema), editPodcast)
router.post("/get-podcast-details", validateBody(z.object({ podcast_id: z.string().min(1, "podcast_id is required.") })), getPodcastById)
router.post("/delete-podcast", validateBody(z.object({ podcast_id: z.string().min(1, "podcast_id is required.") })), deletePodcast)


// routers for episode ==============================
router.post("/add-episode", addEpisode)
router.post("/get-episode-list", validateBody(z.object({ podcast_id: z.string() })), getEpisodeList)
router.post("/edit-episode", editEpisode)
router.post("/delete-episode", validateBody(deleteEpisodeSchema), deleteEpisode)

// routers for broadcast notifications ============
router.post('/send-broadcast-notification', validateBody(broadcastMessageSchema), broadcastMessage);
router.post('/list-broadcast-notification', validateBody(getBroadcastMessageSchema), getbroadcastMessage);

export default router;
