import { validateBody } from "../middleware/zod.middleware";
import { search } from "../controllers/explore.controller";
import { Router } from "express";
import { searchSchema } from "../zod/explore.validator";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post('/search',authenticate, validateBody(searchSchema), search);

export default router;