import db from "../models";

const { SearchHistory, MusicSinger, User } =db;
import {
  album_service,
  genre_category_service,
  song_service,
  user_service,
} from ".";

async function addToSearchHistory(
  userId: number,
  type: string,
  songId?: number,
  artistId?: number,
  albumId?: number,
  genreId?: number
): Promise<any> {
  try {
    let searchHistory = await SearchHistory.findOne({
      where: {
        user_id: userId,
        type,
        ...(songId && { song_id: songId }),
        ...(artistId && { artist_id: artistId }),
        ...(albumId && { album_id: albumId }),
        ...(genreId && { genre_id: genreId }),
      },
    });
    if (searchHistory) {
      await SearchHistory.update(
        {
          user_id: userId,
        },
        {
          where: {
            user_id: userId,
            type,
            ...(songId && { song_id: songId }),
            ...(artistId && { artist_id: artistId }),
            ...(albumId && { album_id: albumId }),
            ...(genreId && { genre_id: genreId }),
          },
        }
      );
    } else {
      searchHistory = await SearchHistory.create({
        user_id: userId,
        type,
        song_id: songId,
        artist_id: artistId,
        album_id: albumId,
        genre_id: genreId,
      });
      return searchHistory.toJSON();
    }
  } catch (err) {
    throw err;
  }
}

async function removeFromSearchHistory(
  userId: number,
  searchId: number
): Promise<any> {
  try {
    const searchHistory = await SearchHistory.destroy({
      where: { user_id: userId, search_id: searchId },
    });
    return searchHistory;
  } catch (err) {
    throw err;
  }
}

async function getSearchHistory(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<any> {
  try {
    const offset = (page - 1) * limit;

    const searchHistory = await SearchHistory.findAndCountAll({
      where: { user_id: userId },
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    });

    // If no search history found, return default structure
    if (!searchHistory || searchHistory.count === 0) {
      return { count: 0, rows: [] };
    }

    // Convert to JSON
    let rows = searchHistory.rows.map((search:any) => search.toJSON());

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
                    attributes: ["user_id", "full_name", "profile_pic"],
                  },
                ],
              },
            ]);
            return { ...search, song };
          }
          if (search.type === "artist") {
            const artist = await user_service.getUser(
              { user_id: search.artist_id },
              [],
              ["user_id", "full_name", "profile_pic"]
            );
            return { ...search, artist };
          }
          if (search.type === "album") {
            const album = await album_service.getAlbum(
              { album_id: search.album_id },
              []
            );
            return { ...search, album };
          }
          if (search.type === "genre") {
            const genre = await genre_category_service.getGenreById(
              search.genre_id
            );
            return { ...search, genre };
          }
        } catch (e) {
          console.warn(
            `Failed to enrich ${search.type} ID in search history:`,
            e
          );
        }

        // Fallback to raw entry if enrichment fails
        return search;
      })
    );

    return {
      count: searchHistory.count,
      rows,
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
