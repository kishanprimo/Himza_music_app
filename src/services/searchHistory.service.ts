import db from "../models";

const { searchHistory, MusicSinger, User, favorites, Downloads, song, Album, Genre } = db;
import { Op, fn, col } from "sequelize";
import { logger } from "../utils";

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

    // Enrich data: one query per entry type for the whole page.
    const idsOf = (type: string, key: string) => [
      ...new Set(
        rows
          .filter((search: any) => search.type === type && search[key] != null)
          .map((search: any) => Number(search[key]))
      ),
    ];
    const songIds = idsOf("song", "song_id");
    const artistIds = idsOf("artist", "artist_id");
    const albumIds = idsOf("album", "album_id");
    const genreIds = idsOf("genre", "genre_id");

    const [songs, favoriteCounts, userFavorites, userDownloads, artists, albums, genres] =
      await Promise.all([
        songIds.length
          ? song.findAll({
            where: { song_id: { [Op.in]: songIds } },
            include: [
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
            ],
          })
          : [],
        songIds.length
          ? favorites.findAll({
            where: { song_id: { [Op.in]: songIds } },
            attributes: ["song_id", [fn("COUNT", col("song_id")), "total"]],
            group: ["song_id"],
            raw: true,
          })
          : [],
        songIds.length
          ? favorites.findAll({
            where: { user_id: userId, song_id: { [Op.in]: songIds } },
            attributes: ["song_id"],
            raw: true,
          })
          : [],
        songIds.length
          ? Downloads.findAll({
            where: { user_id: userId, song_id: { [Op.in]: songIds } },
            attributes: ["song_id"],
            raw: true,
          })
          : [],
        artistIds.length
          ? User.findAll({
            where: { user_id: { [Op.in]: artistIds }, is_deleted: false },
            attributes: ["user_id", "full_name", "profile_pic"],
          })
          : [],
        albumIds.length
          ? Album.findAll({ where: { album_id: { [Op.in]: albumIds } } })
          : [],
        genreIds.length
          ? Genre.findAll({ where: { genre_id: { [Op.in]: genreIds } } })
          : [],
      ]);

    const favoriteCountMap = new Map<number, number>(
      favoriteCounts.map((item: any) => [Number(item.song_id), Number(item.total)])
    );
    const favoriteSet = new Set(userFavorites.map((item: any) => Number(item.song_id)));
    const downloadSet = new Set(userDownloads.map((item: any) => Number(item.song_id)));
    const byId = (list: any[], key: string) =>
      new Map<number, any>(list.map((item: any) => [Number(item.get(key)), item.toJSON()]));
    const songMap = byId(songs, "song_id");
    const artistMap = byId(artists, "user_id");
    const albumMap = byId(albums, "album_id");
    const genreMap = byId(genres, "genre_id");

    rows = rows.map((search: any) => {
      if (search.type === "song") {
        const id = Number(search.song_id);
        const found = songMap.get(id);
        // Song nahi hai to entry remove
        if (!found) return null;
        return {
          ...search,
          song: { ...found, favorite_count: favoriteCountMap.get(id) ?? 0 },
          is_favorite: favoriteSet.has(id),
          is_downloaded: downloadSet.has(id),
        };
      }
      if (search.type === "artist") {
        const artist = artistMap.get(Number(search.artist_id));
        return artist ? { ...search, artist } : null;
      }
      if (search.type === "album") {
        const album = albumMap.get(Number(search.album_id));
        return album ? { ...search, album } : null;
      }
      if (search.type === "genre") {
        const genre = genreMap.get(Number(search.genre_id));
        return genre ? { ...search, genre } : null;
      }
      return search;
    });

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
    logger.error("Error fetching search history:", err);
    throw err;
  }
}

export default {
  addToSearchHistory,
  getSearchHistory,
  removeFromSearchHistory,
};
