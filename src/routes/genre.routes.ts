import { Router } from "express";
import {
  getAllGenre,
  createGenre,
  removeGenre,
  getSongsByGenre,
} from "../controllers/genre.controller";
import { validateBody } from "../middleware/zod.middleware";
import { paginationSchema } from "../zod/pagenation.validator";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware";
const router = Router();

router.post(
  "/get-all",
  validateBody(
    z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      sort_by: z.string().optional(),
      sort_order: z.string().optional(),
    })
  ),
  getAllGenre
);
router.post(
  "/songs",
  authenticate,
  validateBody(
    z.object({
      genre_id: z.string().min(1, "genre_id is required."),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
  ),
  getSongsByGenre
);
export default router;
