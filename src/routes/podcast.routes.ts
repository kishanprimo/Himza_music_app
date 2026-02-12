import express from "express";
import { createPodcast,getAllPodcast,editPodcast,getPodcastById,deletePodcast } from "../controllers/podcast.controller";
import { validateBody } from "../middleware/zod.middleware";
import z from "zod";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();
 

router.post("/get-podcast-list",getAllPodcast);
router.use(authenticate)
router.post("/get-podcast-details",validateBody(z.object({podcast_id:z.string().min(1,"podcast_id is required.")})),getPodcastById)


export default router;