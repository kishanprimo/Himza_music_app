import { authenticate } from "../middleware/auth.middleware";
import {
  getUser,
  updateCurrentsong,
  updateSongTime,
  updateUser,
  userHistory,
  validateUsername,
  deleteUser,
  getUserSubscriptions,
} from "../controllers/user.controller";
import { Router } from "express";
import { validateBody } from "../middleware/zod.middleware";
import {
  updateCurrentSongSchema,
  updateSongTimeSchema,
  validateUsernameSchema,
} from "../zod/user.validator";
import z from "zod";

const router = Router();

router.post(
  "/validate-username",
  validateBody(validateUsernameSchema),
  validateUsername
); // Uncomment if you have a song time update controller
router.use(authenticate);
router.get("/profile", getUser);
router.post("/update", updateUser);
router.post(
  "/update-current-song",
  validateBody(updateCurrentSongSchema),
  updateCurrentsong
);
router.post(
  "/history",
  validateBody(
    z.object({ page: z.string().optional(), limit: z.string().optional() })
  ),
  userHistory
); // Uncomment if you have a history controller
router.post(
  "/update-song-time",
  validateBody(updateSongTimeSchema),
  updateSongTime
); // Uncomment if you have a song time update controller
router.post("/delete", deleteUser);
router.post("/subscriptions-history", getUserSubscriptions);

export default router;
