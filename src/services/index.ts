import user_service from "./user.service";
import token_service from "./common/token.service";
import response_service from "./common/response.service";
import singer_service from "./singer.service";
import album_service from "./album.service";
import song_service from "./song.service";
import genre_category_service from "./genre.service";
import history_service from "./history.service";
import admin_service from "./admin.auth.service";
import home_service from "./home.service";
import dashboard_service from "./dashboard.service";
import explore_service from "./explore.service";
import movie_service from "./movie.service";
import { getAllAvatars } from "./avatar.service";
import searchHistory_service from "./searchHistory.service";
import ad_service from "./ad.service";
import config_service from "./config.service";
import subscription_service from "./subscription.service";
import podcast_service from './podcast.service'

export {
  response_service,
  user_service,
  singer_service,
  token_service,
  explore_service,
  home_service,
  album_service,
  song_service,
  genre_category_service,
  history_service,
  admin_service,
  dashboard_service,
  movie_service,
  getAllAvatars,
  searchHistory_service,
  ad_service,
  config_service,
  subscription_service,
  podcast_service
};
