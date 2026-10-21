import db from "../models";

const { SearchHistory, searchHistory, MusicSinger, User, favorites, Downloads } = db;
import {
  album_service,
  genre_category_service,
  song_service,
  user_service,
} from ".";
import { and } from "sequelize";

async function addToSearchHistory(
  userId: number,
  type: string,
  songId?: number,
  artistId?: number,
  albumId?: number,
  genreId?: number,
): Promise<any> {
  try {
    let whereCondition: any = {
      user_id: userId,
      type,
    };

    let createData: any = {
      user_id: userId,
      type,
      song_id: null,
      artist_id: null,
      album_id: null,
      genre_id: null,
    };

    switch (type) {
      case "song":
        if (!songId) throw new Error("song_id is required");
        whereCondition.song_id = songId;
        createData.song_id = songId;
        break;

      case "artist":
        if (!artistId) throw new Error("artist_id is required");
        whereCondition.artist_id = artistId;
        createData.artist_id = artistId;
        break;

      case "album":
        if (!albumId) throw new Error("album_id is required");
        whereCondition.album_id = albumId;
        createData.album_id = albumId;
        break;

      case "genre":
        if (!genreId) throw new Error("genre_id is required");
        whereCondition.genre_id = genreId;
        createData.genre_id = genreId;
        break;

      default:
        throw new Error("Invalid search type");
    }

    let searchHistorys = await searchHistory.findOne({
      where: whereCondition,
    });

    if (searchHistorys) {
      // Optional: update timestamp if you want
      await searchHistorys.update({});
      return searchHistorys.toJSON();
    }

    searchHistorys = await searchHistory.create(createData);
    return searchHistorys.toJSON();
  } catch (err) {
    throw err;
  }
}

async function removeFromSearchHistory(
  userId: number,
  searchId: number,
): Promise<any> {
  try {
    const searchHistorys = await searchHistory.destroy({
      where: { user_id: userId, search_id: searchId },
    });
    return searchHistorys;
  } catch (err) {
    throw err;
  }
}

async function getSearchHistory(
  userId: number,
  page: number = 1,
  limit: number = 10,
): Promise<any> {
  try {
    page = parseInt(page as any, 10);
    limit = parseInt(limit as any, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const searchHistorys = await searchHistory.findAndCountAll({
      where: { user_id: userId },
      order: [["updatedAt", "DESC"]],
      limit: Number(limit),
      offset: Number(offset),
    });

    // If no search history found, return default structure
    if (!searchHistorys || searchHistorys.count === 0) {
      return { count: 0, rows: [] };
    }

    // Convert to JSON
    let rows = searchHistorys.rows.map((search: any) => search.toJSON());

    // Enrich data
    rows = await Promise.all(
      rows.map(async (search: any) => {
        try {
          if (search.type === "song") {
            const song = await song_service.getSong(search.song_id, [
              {
                model: MusicSinger,
                as: "artists",
                include: [
                  {
                    model: User,
                    as: "singer",
                    attributes: [
                      "user_id",
                      "full_name",
                      "profile_pic",
                    ],
                  },
                ],
              },
            ]);

            // Song nahi hai to entry remove
            if (!song) {
              return null;
            }

            const [favorite, downloaded] = await Promise.all([
              favorites.findOne({
                where: {
                  user_id: userId,
                  song_id: song.song_id,
                },
              }),
              Downloads.findOne({
                where: {
                  user_id: userId,
                  song_id: song.song_id,
                },
              }),
            ]);

            return {
              ...search,
              song,
              is_favorite: !!favorite,
              is_downloaded: !!downloaded,
            };
          }

          if (search.type === "artist") {
            const artist = await user_service.getUser(
              { user_id: search.artist_id },
              [],
              ["user_id", "full_name", "profile_pic"]
            );

            if (!artist) {
              return null;
            }

            return {
              ...search,
              artist,
            };
          }

          if (search.type === "album") {
            const album = await album_service.getAlbum(
              { album_id: search.album_id },
              []
            );

            if (!album) {
              return null;
            }

            return {
              ...search,
              album,
            };
          }

          if (search.type === "genre") {
            const genre =
              await genre_category_service.getGenreById(
                search.genre_id
              );

            if (!genre) {
              return null;
            }

            return {
              ...search,
              genre,
            };
          }

          return search;
        } catch (e) {
          console.warn(
            `Failed to enrich ${search.type} ID in search history:`,
            e
          );

          return null;
        }
      })
    );

    // Remove unavailable records
    rows = rows.filter(Boolean);

    // Correct count
    const validCount = rows.length;

    return {
      count: validCount,
      rows,
      pagination: {
        current_page: page,
        records_per_page: limit,
        total_records: validCount,
        total_pages: Math.ceil(validCount / limit),
      },
    };
  } catch (err) {
    console.error("Error fetching search history:", err);
    throw err;
  }
}

export default {
  addToSearchHistory,
  getSearchHistory,
  removeFromSearchHistory,
};
