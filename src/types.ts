import { IntegerType } from "typeorm";

export interface IUser {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
  login_type: "email" | "social";
  otp: IntegerType;
  login_verification_status: boolean;
  gender: string;
  dob: string;
  profile_pic: string;
  is_admin: boolean;
  current_song_id?: string; // Assuming current_song is a song_id
  current_album_id?: string; // Assuming current_album_id is an album_id
  current_song_time?: string; // Assuming current_song_time is a time string like "00:00"
  device_token?: string;
  subscription_plan_id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  subscription_plan_expires?: Date;
  is_singer: boolean;
  mobile_number: string;
  country_code: string;
  is_deleted?: boolean;
}

export interface ISong {
  song_id: string;
  title: string;
  audio: string;
  thumbnail: string;
  genre_id: string;
  artists?: IMusicSinger[]; // Assuming singer is a string, could be an ObjectId or reference to another model
  category_id: string;
  duration: string;
  is_favorite?: boolean;
  movie?: IMovie;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Ifavorite {
  favorite_id: string;
  user_id: string;
  song_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDownload {
  download_id: string;
  user_id: string;
  song_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISongSinger {
  song_id: string;
  user_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAlbum {
  album_id: string;
  title: string;
  thumbnail: string;
  genre: string;
  is_private: boolean;
  descrption: string;
  songs: ISong[];
  is_album_liked?: boolean;
  user_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Ifavorites {
  user_id: string;
  song_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGenre {
  genre_id: string;
  name: string;
  background_img: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategories {
  category_id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMusicSinger {
  singer_id: string;
  user_id: string;
  song_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAlbumSongs {
  album_song_id: string;
  album_id: string;
  song_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHistory {
  history_id: string;
  song_id: string;
  user_id: string;
  album_id: string;
  song_time: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdmin {
  admin_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  profile_pic: string;
  gender: string;
  dob: string;
  mobile_number: string;
  previous_password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHomeBlocks {
  block_id: string;
  type: string; // e.g., 'artist', 'album', 'song','artist'
  subtitle: string;
  title: string;
  description: string;
  albums?: IAlbum[]; // Assuming albums is an array of album objects
  songs?: ISong[]; // Assuming songs is an array of song objects
  genres?: IGenre[]; // Assuming genres is an array of genre objects
  artists?: IMusicSinger[]; // Assuming artists is an array of artist objects
  album_ids: number[];
  song_ids: number[];
  genre_ids: number[];
  artist_ids?: number[]; // Assuming artist_ids is an array of artist IDs
  is_deleted: boolean;
  order_id:number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMovie {
  movie_id: string;
  title: string;
  description: string;
  poster: string;
  songs?: ISong[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAds {
  ad_id: string;
  title: string;
  type: string;
  banner: string;
  video: string;
  audio: string;
  description: string;
  link: string;
  start_date: string;
  end_date: string;
  position: string;
  placement: string;
  duration: number;
  is_deleted: boolean;
  is_visible: boolean;
  order_id: number;
  album_ids: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionPlans {
  plan_id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  features: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Podcast type =====================================================
export interface IPodcast {
  podcast_id:number;
  title:string;
  description:string;
  image:string;
  category:string;
  is_delete:boolean;
  episodes:Episodes[];
  createdAt?:Date;
  updatedAt?:Date;
}

export interface Episodes {
  episode_id:number;
  episode_title:string;
  episode_description:string;
  episode_audio:string;
  is_delete:boolean;
  createdAt?:Date;
  updatedAt?:Date;
}

export interface IPlaylist {
  playlist_id: string;
  title: string;
  description: string;
  thumbnail: string;
  genre_id: string;
  is_private: boolean;
  user_id: string;
  songs?: ISong[];
  createdAt?: Date;
  updatedAt?: Date;
}
