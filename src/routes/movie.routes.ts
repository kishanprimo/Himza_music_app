import { validateBody } from "../middleware/zod.middleware";
import { getAllMovies, getMovieById } from "../controllers/movie.controller";
import { Router } from "express";
import z from "zod";

const router = Router();

router.post(
    '/get',
    validateBody(z.object({ movie_id: z.string().min(1, 'movieId is required.') })),
    getMovieById
);
router.post('/get-all-movies', getAllMovies);


export default router;