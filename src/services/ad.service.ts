import { IAds } from "../types";
import db from "../models";

const { Ads } = db;
import { col, fn, Op, Sequelize, WhereOptions } from "sequelize";

async function getAdsForAdmin({
  payload = {},
  page = 1,
  limit = 10,
  search_by = "createdAt",
  search_order = "DESC",
  search_term = "",
}: {
  payload?: WhereOptions<IAds>;
  page?: number;
  limit?: number;
  search_by?: string;
  search_order?: "ASC" | "DESC";
  search_term?: string;
}): Promise<{ data: IAds[]; Pagination: any }> {
  try {
    const ads = await Ads.findAll({
      where: payload,
      offset: (page - 1) * limit,
      limit: limit,
      order: [[search_by, search_order]],
      ...(search_term && {
        where: { [Op.or]: [{ title: { [Op.iLike]: `%${search_term}%` } }] },
      }),
    });
    // const total = await Ads.count({ where: payload });

    // remove the data from total if deleted
    const total = await Ads.count({
      where: {
        ...payload, // keep your existing filters
        is_deleted: false, // only count non-deleted records
      },
    });

    return {
      data: ads.map((ad: any) => ad.toJSON()),
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

async function getAds(payload: WhereOptions<IAds> = {}): Promise<IAds[]> {
  try {
    const ads = await Ads.findAll({ where: payload });
    return ads.map((ad: any) => ad.toJSON());
  } catch (err) {
    throw err;
  }
}

async function createAd(payload: Partial<IAds>): Promise<IAds> {
  try {
    const ad = await Ads.create(payload);
    return ad.toJSON();
  } catch (err) {
    throw err;
  }
}

async function updateAd(payload: any, where: any): Promise<IAds | null> {
  try {
    const ad = await Ads.update(payload, { where: where, returning: true });
    if (ad[1].length <= 0) return null;
    return ad[1][0].toJSON();
  } catch (err) {
    throw err;
  }
}

// delete ad ==================================================
async function deleteAd(where: any): Promise<IAds | null> {
  try {
    const ad = await Ads.update(
      { is_deleted: true },
      { where: where, returning: true }
    );
    if (ad[1].length <= 0) return null;
    return ad[1][0].toJSON();
  } catch (err) {
    throw err;
  }
}

async function getAdsForAlbum(album_id: number): Promise<IAds[]> {
  try {
    const ads = await Ads.findAll({
      where: { album_ids: { [Op.contains]: [album_id] } },
    });
    return ads.map((ad: any) => ad.toJSON());
  } catch (err) {
    throw err;
  }
}

async function getAdsForHome(): Promise<IAds[]> {
  try {
    const ads = await Ads.findAll({ where: { position: "home" } });
    return ads.map((ad: any) => ad.toJSON());
  } catch (err) {
    throw err;
  }
}

async function addAlbumsToAd(
  ad_id: number,
  album_id: number
): Promise<IAds | null> {
  try {
    const [count, updated] = await Ads.update(
      {
        album_ids: fn("array_append", col("album_ids"), album_id),
      },
      {
        where: { ad_id },
        returning: true,
      }
    );

    return updated[0]?.toJSON() ?? null;
  } catch (err) {
    throw err;
  }
}

async function removeAlbumsFromAd(
  ad_id: number,
  album_id: number
): Promise<IAds | null> {
  try {
    const [count, updated] = await Ads.update(
      {
        album_ids: Sequelize.literal(`array_remove(album_ids, ${album_id})`),
      },
      {
        where: { ad_id },
        returning: true,
      }
    );

    return updated[0]?.toJSON() ?? null;
  } catch (err) {
    throw err;
  }
}

export default {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getAdsForAlbum,
  getAdsForHome,
  addAlbumsToAd,
  removeAlbumsFromAd,
  getAdsForAdmin,
};
