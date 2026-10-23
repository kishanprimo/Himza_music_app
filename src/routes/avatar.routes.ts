import { getAllAvatarsController } from "../controllers/avatar.controller";
import { Router } from "express";

const router = Router();

router.get('/get-all', getAllAvatarsController);

export default router;