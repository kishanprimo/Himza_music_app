import express from "express";
import { validateBody } from "../middleware/zod.middleware";
import { authenticate, authenticateAdmin } from "../middleware/auth.middleware";
import z from "zod";
import {
  getFavoriteArtists,
  setfavorite,
} from "../controllers/singer.controller";
import {
  addAlbumsToAd,
  createAd,
  getAds,
  getAdsForAlbum,
  getAdsForHome,
  removeAlbumsFromAd,
  updateAd,
} from "../controllers/ad.controller";
import { getAdsForAdmin, deleteAd } from "../controllers/ad.controller";

const router = express.Router();

// router.use(authenticate)

router.post(
  "/get-all",
  validateBody(
    z.object({
      type: z.enum(["banner", "video"]),
      page: z.string().optional(),
      limit: z.string().optional(),
      search_by: z.string().optional(),
      search_order: z.string().optional(),
      search_term: z.string().optional(),
    })
  ),
  getAds
);
router.post(
  "/create",
  authenticateAdmin,
  validateBody(
    z.object({
      title: z.string().min(1, "Title is required."),
      type: z.enum(["banner", "video"]),
      description: z.string().optional(),
      link: z.string().optional(),
      position: z.enum(["Top", "Middle", "Bottom"]).optional(),
      placement: z.enum(["Home", "Album", "Genre", "Song"]).optional(),
      // duration_in_sec: z.string().min(1, "Duration is required."),
      order_id: z.string().optional(),
    })
  ),
  createAd
);

router.post(
  "/update",
  authenticateAdmin,
  validateBody(
    z.object({
      ad_id: z.string().min(1, "Ad id is required."),
      title: z.string().optional(),
      description: z.string().optional(),
      link: z.string().optional(),
      // start_date: z.string().optional(),
      // end_date: z.string().optional(),
      position: z.enum(["Top", "Middle", "Bottom"]).optional(),
      placement: z.enum(["Home", "Album", "Genre", "Song"]).optional(),
      duration_in_sec: z.string().optional(),
      order_id: z.string().optional(),
      is_visible: z.boolean().optional(),
    })
  ),
  updateAd
);

router.post(
  "/for-album",
  validateBody(
    z.object({ album_id: z.string().min(1, "album_id is required.") })
  ),
  getAdsForAlbum
);
router.post("/for-home", getAdsForHome);
router.post(
  "/add-albums",
  authenticateAdmin,
  validateBody(
    z.object({
      ad_id: z.string().min(1, "ad_id is required."),
      album_id: z.string().min(1, "album_id is required."),
    })
  ),
  addAlbumsToAd
);
router.post(
  "/remove-albums",
  authenticateAdmin,
  validateBody(
    z.object({
      ad_id: z.string().min(1, "ad_id is required."),
      album_id: z.string().min(1, "album_id is required."),
    })
  ),
  removeAlbumsFromAd
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

export default router;
