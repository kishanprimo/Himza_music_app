import express from 'express';
import { validateBody } from '../middleware/zod.middleware';
import { authenticate } from '../middleware/auth.middleware';
import z from 'zod';
import { getFavoriteArtists, setfavorite, searchFavoriteArtists } from '../controllers/singer.controller';


const router = express.Router();

router.use(authenticate)

router.post('/favorite', validateBody(z.object({ artist_id: z.string().min(1, 'artist_id is required.') })), setfavorite);
router.post('/get-favorite-artists', getFavoriteArtists);
router.post('/search-favorite-artists', searchFavoriteArtists);


export default router;
