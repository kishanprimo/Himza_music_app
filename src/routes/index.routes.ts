import { Router } from 'express';
import auth_routes from './auth.routes';
import user_routes from './user.routes';
import album_routes from './album.routes';
import song_routes from './song.routes';
import genre_routes from './genre.routes';
import admin_routes from './admin.routes';
import avatar_routes from './avatar.routes';
import home_routes from './home.routes';
import explore_routes from './explore.routes';
import movie_routes from './movie.routes';
import { uploadDocs } from '../middleware/upload.middleware';
import artist_routes from './artist.routes';
import searchHistory_routes from './searchHistory.routes';
import ad_routes from './ad.routes';
import subscription_routes from './subscription.routes';
import podcast_routes from './podcast.routes';

const router = Router();

router.use(uploadDocs)

router.use('/auth', auth_routes);
router.use('/user', user_routes);
router.use('/album', album_routes);
router.use('/song', song_routes);
router.use('/genre', genre_routes);
router.use('/admin', admin_routes);
router.use('/avatar', avatar_routes);
router.use('/home', home_routes);
router.use('/explore', explore_routes);
router.use('/movie', movie_routes);
router.use('/artist', artist_routes);
router.use('/search-history', searchHistory_routes);
router.use('/ad', ad_routes);
router.use('/subscription', subscription_routes);
router.use('/podcast',podcast_routes);

export default router;
