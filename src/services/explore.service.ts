import db from "../models";

const { Song,song, Album, User } = db;
import { Op } from "sequelize";

interface SearchResult {
  length: number;
  songs: {
    data: any[];
    total: number;
  };
  artists: {
    data: any[];
    total: number;
  };
  albums: {
    data: any[];
    total: number;
  };
}

async function search(
  searchTerm: string,
  type?: 'song' | 'artist' | 'album',
  page: number = 1,
  limit: number = 10
): Promise<SearchResult> {
  try {
    const offset = (page - 1) * limit;

    // Initialize result structure
    const result: SearchResult = {
      length: 0,
      songs: { data: [], total: 0 },
      artists: { data: [], total: 0 },
      albums: { data: [], total: 0 }
    };

    if (!type || type === 'song') {
      const songsResult = await song.findAndCountAll({
        where: {
          title: {
            [Op.iLike]: `${searchTerm}%`
          }
        },
        limit,
        offset
      });
      result.songs = {
        data: songsResult.rows.map((song:any) => song.toJSON()),
        total: songsResult.count
      };
      result.length += songsResult.count;
    }

    if (!type || type === 'artist') {
      const artistsResult = await User.findAndCountAll({
        where: {
          full_name: {
            [Op.iLike]: `${searchTerm}%`
          },
          is_singer: true
        },
        limit,
        offset
      });
      result.artists = {
        data: artistsResult.rows.map((artist:any) => artist.toJSON()),
        total: artistsResult.count
      };
      result.length += artistsResult.count;
    }

    if (!type || type === 'album') {
      const albumsResult = await Album.findAndCountAll({
        where: {
          title: {
            [Op.iLike]: `${searchTerm}%`
          }
        },
        limit,
        offset
      });
      result.albums = {
        data: albumsResult.rows.map((album:any) => album.toJSON()),
        total: albumsResult.count
      };
      result.length += albumsResult.count;
    }

    return result;
  } catch (err) {
    throw err;
  }
}


export default{ search};
