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

// Accept ids / paging values sent as either JSON numbers or strings.
const stringOrNumber = z.union([z.string(), z.number()]).transform(String);

router.use(authenticate);

router.post(
  "/add",
  validateBody(
    z.object({
      type: z.enum(["song", "artist", "album", "genre"]),
      song_id: stringOrNumber.optional(),
      artist_id: stringOrNumber.optional(),
      album_id: stringOrNumber.optional(),
      genre_id: stringOrNumber.optional(),
    })
  ),
  addToSearchHistory
);

router.post(
  "/get",
  validateBody(
    z.object({
      page: stringOrNumber.optional(),
      limit: stringOrNumber.optional(),
    })
  ),
  getSearchHistory
);

router.post(
  "/remove",
  validateBody(
    z.object({
      search_id: stringOrNumber.refine((v) => v.length > 0, "search_id is required."),
    })
  ),
  removeFromSearchHistory
);

export default router;
