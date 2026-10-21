import { log } from "console";
import db from "../models";

const { User } = db;
import { IUser } from "../types";
import removeExtraFields from "./common/removeExtraFields.service";
const { SubscribedUsers, SunscriptionPlans, MusicSinger, song } = db;

async function getUser(
  data: Partial<IUser>,
  include?: any,
  attributes?: any
): Promise<IUser | null> {
  try {
    const user = await User.findOne({
      where: { ...data, is_deleted: false },
      include,
      attributes,
    });
    if (!user) return null;
    return removeExtraFields(user.toJSON(), [
      "password",
      "otp",
      // 'current_song_time',
      // 'current_song_id',
      // 'current_album_id'
    ]) as IUser;
  } catch (err) {
    throw err;
  }
}

async function createUser(data: Partial<IUser>): Promise<IUser | null> {
  try {
    const user = await User.create(data);
    if (!user) return null;
    return user.toJSON() as IUser;
  } catch (err) {
    throw err;
  }
}

async function updateUser(
  data: Partial<IUser>,
  where: Partial<IUser>
): Promise<IUser | null> {
  try {
    const [updatedCount] = await User.update(data, {
      where: {
        ...where,
        is_deleted: false,
      },
    });

    if (updatedCount === 0) {
      return null;
    }

    const user = await User.findOne({
      where: {
        ...where,
        // is_deleted condition yaha mat lagao
      },
    });

    if (!user) return null;

    return removeExtraFields(user.toJSON(), [
      "password",
      "otp",
    ]) as IUser;
  } catch (err) {
    throw err;
  }
}

async function deleteUser(where: Partial<IUser>): Promise<boolean> {
  try {
    await User.update(
      { email: null, mobile_number: null, is_deleted: true },
      { where: where }
    );
    return true;
  } catch (err) {
    throw err;
  }
}

async function getUserSubscriptions(
  user_id?: number,
  page: number = 0,
  limit: number = 0
): Promise<{ subscriptions: any[]; Pagination: any }> {
  try {
    const subscriptions = await SubscribedUsers.findAll({
      ...(user_id && { where: { user_id: user_id } }),
      include: [
        {
          model: SunscriptionPlans,
          as: "plan",
          attributes: {
            exclude: ["createdAt", "updatedAt", "features"],
          },
        },
        {
          model: User,
          as: "user",
          attributes: [
            "user_id",
            "full_name",
            "email",
            "mobile_number",
            "profile_pic",
          ],
        },
      ],
      limit,
      offset: (page - 1) * limit,
    });
    const total = await SubscribedUsers.count({
      ...(user_id && { where: { user_id: user_id } }),
    });
    return {
      subscriptions,
      Pagination: {
        current_page: page,
        records_per_page: limit,
        total_pages: Math.ceil(total / limit),
        total_records: total,
      },
    };
  } catch (err) {
    throw err;
  }
}

async function getArtist(artist_id: string) {
  try {
    // 1️⃣ Artist check
    const artist = await User.findOne({
      where: {
        user_id: artist_id,
        is_deleted: false,
        is_singer: true,
      },
      attributes: { exclude: ["password", "otp"] },
    });

    if (!artist) return null;

    // 2️⃣ Songs fetch via music_singer
    const songs = await MusicSinger.findAll({
      where: {
        user_id: artist_id,
      },
      include: [
        {
          model: song,
          as: "song", // relation name check kar lena
        },
      ],
    });

    // 3️⃣ Clean response
    const songList = songs.map((item: any) => item.song);

    // 4️⃣ Final response
    return {
      artist,
      songs: songList,
    };
  } catch (err) {
    throw err;
  }
}

export default {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscriptions,
  getArtist,

};
