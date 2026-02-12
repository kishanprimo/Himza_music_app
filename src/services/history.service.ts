import db from "../models";

const { Movie, MovieSongConnection, MusicSinger, Song, User, History } =db;
import { IHistory } from "../types";

async function addToHistory(
  songId: number,
  userId: number,
  albumId?: number | null,
  songTime?: string | null
): Promise<IHistory | null> {
  try {
    const historyEntry = await History.create({
      song_id: songId,
      user_id: userId,
      album_id: albumId,
      song_time: songTime,
    });
    if (historyEntry) return historyEntry.toJSON() as IHistory;
    return null;
  } catch (err) {
    throw err;
  }
}

async function getUserHistory(
  userId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<{
  data: IHistory[];
  total: number;
  page: number;
  pageSize: number;
} | null> {
  try {
    const offset = (page - 1) * pageSize;

    const { count, rows } = await History.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Song,
          as: "song",
          include: [
            {
              model: MusicSinger,
              as: "artists",
              attributes: ["music_singer_id"],
              include: [
                {
                  model: User,
                  as: "singer",
                  attributes: ["user_id", "full_name", "profile_pic"],
                },
              ],
            },
            {
              model: MovieSongConnection,
              as: "movie",
              include: [
                {
                  model: Movie,
                  as: "movie_details",
                  attributes: ["movie_id", "title", "poster"],
                },
              ],
              attributes: ["movie_song_id"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: pageSize,
    });

    return {
      data: rows.map((entry:any) => entry.toJSON() as IHistory),
      total: count,
      page,
      pageSize,
    };
  } catch (err) {
    throw err;
  }
}

async function updateHistoryTime(
  history_id: number,
  time: string
): Promise<IHistory | null> {
  try {
    const [updatedCount, updatedEntries] = await History.update(
      { song_time: time },
      { where: { history_id }, returning: true }
    );
    if (updatedCount > 0 && updatedEntries.length > 0) {
      return updatedEntries[0].toJSON() as IHistory;
    }
    return null;
  } catch (err) {
    throw err;
  }
}

export default { addToHistory, getUserHistory, updateHistoryTime };
