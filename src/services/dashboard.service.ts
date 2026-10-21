import { IUser } from "../types";
import db from "../models";

const {
  Album,
  favoriteArtists,
  Genre,
  Movie,
  MusicSinger,
  song: Song,
  SubscribedUsers,
  User,
  History
} = db;
import { fn, col, literal, QueryTypes } from "sequelize";
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

        return result.map((row: any) => row.toJSON());
      case "songs":
        return await Song.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("song_id")), "count"],
          ],
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        }).then((result: any) => result.map((row: any) => row.toJSON()));
      case "albums":
        return await Album.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("album_id")), "count"],
          ],
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        }).then((result: any) => result.map((row: any) => row.toJSON()));
      case "artists":
        return await User.findAll({
          attributes: [
            [fn("TO_CHAR", col("createdAt"), format), "period"],
            [fn("COUNT", col("user_id")), "count"],
          ],
          where: { is_deleted: false, is_singer: true },
          group: [fn("TO_CHAR", col("createdAt"), format)],
          order: [[literal(`period`), "ASC"]],
        }).then((result: any) => result.map((row: any) => row.toJSON()));
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
        ...(user_name !== "" && {
          [Op.or]: [
            { full_name: { [Op.like]: `%${user_name}%` } },
            { username: { [Op.like]: `%${user_name}%` } },
          ],
        }),
        ...where,
      },

      order:
        sort_by !== "" && sort_order !== ""
          ? [[sort_by, sort_order]]
          : [["user_id", "DESC"]],

      limit: pageSize,
      offset,
    });

    const cleanedUsers: IUser[] = await Promise.all(
      users.map(async (user: any) => {
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
    const data = result.map((row: any) => row.toJSON());
    let total = 0;
    await Promise.all(
      data.map(async (user: any) => {
        total += Number(user.count);
      })
    );
    await Promise.all(
      data.map(async (user: any) => {
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

    console.log({
      User,
      Album,
      Song,
      SubscribedUsers,
    });
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
          (acc: any, user: any) => acc + user.amount,
          0
        );
        const lastMonth_earnings = lastMonth.reduce(
          (acc: any, user: any) => acc + user.amount,
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

// ==================== NEW DASHBOARD STATISTICS METHODS ====================

/**
 * Get all platform statistics for dashboard
 * @returns Complete dashboard statistics object
 */
export async function getPlatformStatistics() {
  try {
    const [
      totalUsers,
      totalSongs,
      totalAlbums,
      userVsLastMonth,
      monthwiseData,
      loginBreakdown,
      totalEarnings,
    ] = await Promise.all([
      getTotalUsers(),
      getTotalSongs(),
      getTotalAlbums(),
      getUsersVsLastMonth(),
      getMonthwiseUserData(),
      getLoginMethodBreakdown(),
      getTotalEarnings(),
    ]);

    return {
      total_users: totalUsers,
      users_vs_last_month: userVsLastMonth,
      total_songs: totalSongs,
      total_albums: totalAlbums,
      total_earnings: totalEarnings,
      user_monthwise: monthwiseData,
      login_method_breakdown: loginBreakdown,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Get total active users count
 */
async function getTotalUsers(): Promise<number> {
  try {
    const count = await User.count({
      where: { is_deleted: false },
    });
    return count;
  } catch (err) {
    throw err;
  }
}

/**
 * Get total songs count
 */
async function getTotalSongs(): Promise<number> {
  try {
    const count = await Song.count();
    return count;
  } catch (err) {
    throw err;
  }
}

/**
 * Get total albums count
 */
async function getTotalAlbums(): Promise<number> {
  try {
    return await Album.count();
  } catch (err) {
    throw err;
  }
}

/**
 * Get total earnings from subscriptions
 */
async function getTotalEarnings(): Promise<number> {
  try {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM subscribedUsers 
      WHERE payment_status = 'completed'
    `;

    const result: any = await db.sequelize?.query(query, {
      type: QueryTypes.SELECT,
    });

    if (!result || result.length === 0) {
      return 0;
    }

    const total = result[0]?.total;
    return total ? parseFloat(String(total)) : 0;
  } catch (err) {
    console.error("Error calculating total earnings:", err);
    return 0;
  }
}

/**
 * Compare current month users with last month users
 * @returns Object with current_month, last_month, difference, and trend
 */
async function getUsersVsLastMonth(): Promise<any> {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentMonthCount = await User.count({
      where: {
        is_deleted: false,
        createdAt: {
          [Op.between]: [currentMonthStart, currentMonthEnd],
        },
      },
    });

    const lastMonthCount = await User.count({
      where: {
        is_deleted: false,
        createdAt: {
          [Op.between]: [lastMonthStart, lastMonthEnd],
        },
      },
    });

    const difference = currentMonthCount - lastMonthCount;
    const trend =
      difference > 0 ? "increase" : difference < 0 ? "decrease" : "same";

    return {
      current_month: currentMonthCount,
      last_month: lastMonthCount,
      difference: Math.abs(difference),
      trend,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Get month-wise user signup data for all 12 months of current year
 * @returns Object with month names as keys and user counts as values
 */
async function getMonthwiseUserData(): Promise<any> {
  try {
    const currentYear = new Date().getFullYear();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Initialize all months with 0
    const monthData: any = {};
    monthNames.forEach((month) => {
      monthData[month] = 0;
    });

    // Use raw SQL query for reliability
    const query = `
      SELECT 
        MONTH(createdAt) as month, 
        COUNT(*) as count 
      FROM users 
      WHERE is_deleted = false 
        AND YEAR(createdAt) = :year
      GROUP BY MONTH(createdAt)
      ORDER BY month ASC
    `;

    const results: any = await db.sequelize?.query(query, {
      replacements: { year: currentYear },
      type: QueryTypes.SELECT,
    });

    // Map data to month names
    if (results && Array.isArray(results)) {
      results.forEach((row: any) => {
        if (row && row.month && row.count) {
          const monthIndex = parseInt(String(row.month)) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            monthData[monthNames[monthIndex]] = parseInt(String(row.count));
          }
        }
      });
    }

    return monthData;
  } catch (err) {
    console.error("Error fetching monthwise data:", err);
    // Return default data on error
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthData: any = {};
    monthNames.forEach((month) => {
      monthData[month] = 0;
    });
    return monthData;
  }
}

/**
 * Get login method breakdown with percentages
 * @returns Object with login methods and their counts and percentages
 */
async function getLoginMethodBreakdown(): Promise<any> {
  try {
    const totalUsers = await User.count({
      where: { is_deleted: false },
    });

    if (totalUsers === 0) {
      return {
        email: { count: 0, percentage: 0 },
        mobile: { count: 0, percentage: 0 },
        google: { count: 0, percentage: 0 },
        apple: { count: 0, percentage: 0 },
      };
    }

    // Use raw SQL for reliability
    const query = `
      SELECT 
        login_type, 
        COUNT(*) as count 
      FROM users 
      WHERE is_deleted = false
      GROUP BY login_type
    `;

    const loginData: any = await db.sequelize?.query(query, {
      type: QueryTypes.SELECT,
    });

    const breakdown: any = {
      email: { count: 0, percentage: 0 },
      mobile: { count: 0, percentage: 0 },
      google: { count: 0, percentage: 0 },
      apple: { count: 0, percentage: 0 },
    };

    // Safely handle results
    if (loginData && Array.isArray(loginData)) {
      loginData.forEach((row: any) => {
        if (row) {
          const loginType = row.login_type || "email";
          const count = row.count ? parseInt(String(row.count)) : 0;
          const percentage = parseFloat(((count / totalUsers) * 100).toFixed(2));

          if (breakdown[loginType]) {
            breakdown[loginType] = { count, percentage };
          }
        }
      });
    }

    return breakdown;
  } catch (err) {
    console.error("Error fetching login breakdown:", err);
    return {
      email: { count: 0, percentage: 0 },
      mobile: { count: 0, percentage: 0 },
      google: { count: 0, percentage: 0 },
      apple: { count: 0, percentage: 0 },
    };
  }
}

export default {
  getAllUsersList,
  count,
  usersByLogin,
  dashboardCountCards,
  getPlatformStatistics,
  getTotalUsers,
  getTotalSongs,
  getTotalAlbums,
  getTotalEarnings,
  getUsersVsLastMonth,
  getMonthwiseUserData,
  getLoginMethodBreakdown,
};
