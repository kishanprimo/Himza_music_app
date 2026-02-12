import { authenticate } from "../middleware/auth.middleware";
import { Router } from "express";
import {
  addToSearchHistory,
  getSearchHistory,
  removeFromSearchHistory,
} from "../controllers/searchHistory.controller";
import { validateBody } from "../middleware/zod.middleware";
import z from "zod";

const router = Router();

router.use(authenticate);

router.post(
  "/add",
  validateBody(
    z.object({
      type: z.enum(["song", "artist", "album", "genre"]),
      song_id: z.string().optional(),
      artist_id: z.string().optional(),
      album_id: z.string().optional(),
      genre_id: z.string().optional(),
    })
  ),
  addToSearchHistory
);

router.post(
  "/get",
  validateBody(
    z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    })
  ),
  getSearchHistory
);

router.post(
  "/remove",
  validateBody(
    z.object({
      search_id: z.string().min(1, "search_id is required."),
    })
  ),
  removeFromSearchHistory
);

export default router;
