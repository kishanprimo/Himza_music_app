import { Router } from "express";
import { getAllBlocks, getBlockById, songsByGenre } from "../controllers/home.controller";
import { validateBody } from "../middleware/zod.middleware";
import { paginationSchema } from "../zod/pagenation.validator";
import { z } from "zod";

const router = Router();

router.get('/all-blocks', getAllBlocks);

router.post('', validateBody(
    z.object({
        block_id: z.string().min(1, 'block_id is required.'),
        page: z.string().optional(),
        limit: z.string().optional(),
        limits: z.object({
            artist: z.string().optional(),
            album: z.string().optional(),
            song: z.string().optional(),
            genre: z.string().optional(),
        }).optional()
    })
), getBlockById); // Assuming this is for getting albums by genre, you might want to change the controller function name
router.get('/songs-by-genre', songsByGenre); // Assuming this is for getting songs by genre, you might want to change the controller function name

export default router;