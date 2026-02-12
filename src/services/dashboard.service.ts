import { IUser } from "../types";
import db from "../models";

const {
  Album,
  favoriteArtists,
  Genre,
  Movie,
  MusicSinger,
  Song,
  SubscribedUsers,
  User,
  History
} = db;
import { fn, col, literal } from "sequelize";
import removeExtraFields from "./common/removeExtraFields.service";
import { Op } from "sequelize";

type Timeframe = "day" | "week" | "month" | "year" | "total";

export async function count(
  timeframe: Timeframe,
  entity: "users" | "songs" | "albums" | "artists" | "movies" | "genre"
): Promise<any[]> {
  try {
    let format: string;

    switch (timeframe) {
      case "total":
        format = ""; // Use a fixed format for total
        break;
      case "day":
        format = "YYYY-MM-DD";
        break;
      case "week":
        format = "IYYY-IW"; // ISO year and week number
        break;
      case "month":
        format = "YYYY-MM";
        break;
      case "year":
        format = "YYYY";
        break;
      case "total":
        format = "YYYY-MM-DD"; // Use a fixed format for total
        break;
      default:
        throw new Error("Invalid timeframe");
    }
    if (format === "") {
      // Return only total count
      switch (entity) {
        case "users":
          const total = await User.count({ where: { is_deleted: false } });
          return [{ period: "Total", count: total }];
        case "songs":
          const totalSongs = await Song.count();
          return [{ period: "Total", count: totalSongs }];
        case "albums":
          const totalAlbums = await Album.count({
            where: { is_deleted: false },
          });
          return [{ period: "Total", count: totalAlbums }];
        case "artists":
          const totalArtists = await User.count({
            where: { is_deleted: false, is_singer: true },
          });
          return [{ period: "Total", count: totalArtists }];
        case "movies":
          const totalMovies = await Movie.count({
            where: { is_deleted: false },
          });
          return [{ period: "Total", count: totalMovies }];
        case "genre":
          const totalGenre = await Genre.count({
            where: { is_deleted: false },
          });
          return [{ period: "Total", count: totalGenre }];
        default:
          throw new Error("Invalid entity type");
      }
    }

    switch (entity) {
      case "users":
        const result = await User.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("user_id")), "count"],
          ],
          where: { is_deleted: false },
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        });

        return result.map((row:any) => row.toJSON());
      case "songs":
        return await Song.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("song_id")), "count"],
          ],
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        }).then((result:any) => result.map((row:any) => row.toJSON()));
      case "albums":
        return await Album.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("album_id")), "count"],
          ],
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        }).then((result:any) => result.map((row:any) => row.toJSON()));
      case "artists":
        return await User.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("user_id")), "count"],
          ],
          where: { is_deleted: false, is_singer: true },
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        }).then((result:any) => result.map((row:any) => row.toJSON()));
      case "movies":
        return await Movie.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("movie_id")), "count"],
          ],
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        });
      case "genre":
        return await Genre.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("genre_id")), "count"],
          ],
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        });
      default:
        throw new Error("Invalid entity type");
    }
  } catch (err) {
    throw err;
  }
}

interface PaginatedUsersResult {
  data: IUser[];
  Pagination: {
    current_page: number;
    records_per_page: number;
    total_pages: number;
    total_records: number;
  };
}

async function getAllUsersList(
  where: Partial<IUser> = {},
  page: number = 1,
  pageSize: number = 10,
  user_name: string = "",
  sort_by: string = "",
  sort_order: string = ""
): Promise<PaginatedUsersResult> {
  try {
    const offset = (page - 1) * pageSize;
    const { rows: users, count: total } = await User.findAndCountAll({
      where: {
        is_deleted: false,
        ...(user_name != "" && {
          [Op.or]: [
            { full_name: { [Op.like]: `%${user_name}%` } },
            { username: { [Op.like]: `%${user_name}%` } },
          ],
        }),
        ...where,
      },
      ...(sort_order != "" &&
        sort_by != "" && {
          order: [[sort_by, sort_order]],
        }),
      limit: pageSize,
      offset,
    });

    const cleanedUsers: IUser[] = await Promise.all(
      users.map(async (user:any) => {
        const cleanedUser = removeExtraFields(user.toJSON(), [
          "password",
          "otp",
          "current_song_time",
          "current_song_id",
          "current_album_id",
        ]) as IUser;

        const likes_count = await favoriteArtists.count({
          where: { artist_user_id: cleanedUser.user_id },
        });
        const songs_count = await MusicSinger.count({
          where: { user_id: cleanedUser.user_id },
        });
        const total_listens = await History.count({
          where: { user_id: cleanedUser.user_id },
        });
        return { ...cleanedUser, likes_count, songs_count, total_listens };
      })
    );
    return {
      data: cleanedUsers,
      Pagination: {
        current_page: page,
        records_per_page: pageSize,
        total_pages: Math.ceil(total / pageSize),
        total_records: total,
      },
    };
  } catch (err) {
    throw err;
  }
}

async function usersByLogin() {
  try {
    const result = await User.findAll({
      attributes: ["login_type", [fn("COUNT", col("user_id")), "count"]],
      where: { is_deleted: false },
      group: ["login_type"],
      order: [[literal(`count`), "DESC"]],
    });
    const data = result.map((row:any) => row.toJSON());
    let total = 0;
    await Promise.all(
      data.map(async (user:any) => {
        total += Number(user.count);
      })
    );
    await Promise.all(
      data.map(async (user:any) => {
        user.count_percentage = (Number(user.count) / total) * 100;
      })
    );
    return data;
  } catch (err) {
    throw err;
  }
}

async function dashboardCountCards(
  entity: "users" | "songs" | "albums" | "earnings"
) {
  try {
    //  total, last month, growth %
    switch (entity) {
      case "users": {
        const total = await User.count({ where: { is_deleted: false } });
        const lastMonth = await User.count({
          where: {
            is_deleted: false,
            createdAt: {
              [Op.gte]: new Date(
                new Date().setMonth(new Date().getMonth() - 1)
              ),
            },
          },
        });
        const growth = ((total - lastMonth) / total) * 100;
        return { total, lastMonth, growth };
      }
      case "songs": {
        const total = await Song.count();
        const lastMonth = await Song.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(
                new Date().setMonth(new Date().getMonth() - 1)
              ),
            },
          },
        });
        const growth = ((total - lastMonth) / total) * 100;
        return { total, lastMonth, growth };
      }
      case "albums": {
        const total = await Album.count();
        const lastMonth = await Album.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(
                new Date().setMonth(new Date().getMonth() - 1)
              ),
            },
          },
        });
        const growth = ((total - lastMonth) / total) * 100;
        return { total, lastMonth, growth };
      }
      case "earnings": {
        const total = await SubscribedUsers.findAll({});
        const lastMonth = await SubscribedUsers.findAll({
          where: {
            createdAt: {
              [Op.gte]: new Date(
                new Date().setMonth(new Date().getMonth() - 1)
              ),
            },
          },
        });
        const total_earnings = total.reduce(
          (acc:any, user: any) => acc + user.amount,
          0
        );
        const lastMonth_earnings = lastMonth.reduce(
          (acc:any, user: any) => acc + user.amount,
          0
        );
        const growth =
          ((total_earnings - lastMonth_earnings) / total_earnings) * 100;
        return { total_earnings, lastMonth_earnings, growth };
      }
    }
  } catch (err) {
    throw err;
  }
}

export default {
  getAllUsersList,
  count,
  usersByLogin,
  dashboardCountCards,
};
