import { IPodcast } from "../types";
import db from "../models";
import { Op, Sequelize } from "sequelize";
const { Podcast, Episode } = db;

// to create podcast =============================================================
export async function createPodcast(payload: any) {
  const { title, description, podcast_image, category, author_name } = payload;

  // check duplicate title
  const exists = await Podcast.findOne({
    where: { title, is_delete: false },
  });

  if (exists) {
    throw new Error("Podcast with this title already exists");
  }

  // save only relative path
  const podcast = await Podcast.create({
    title,
    description,
    podcast_image, // example: /uploads/podcast/img.png
    category,
    author_name,
  });

  return podcast;
}

// to get all podcast list ===============================

export async function getAllPodcast(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  category?: string
): Promise<{ data: any[]; Pagination: any }> {
  const currentPage = page > 0 ? page : 1;
  const limit = pageSize > 0 ? pageSize : 10;
  const offset = (currentPage - 1) * limit;

  const trimmedSearch = search?.trim();

  const whereCondition: any = {
    is_delete: false,
  };

  // search by title
  if (trimmedSearch) {
    whereCondition.title = {
      [Op.iLike]: `%${trimmedSearch}%`,
    };
  }

  // filter by category (Trending, Popular, etc.)
  if (category) {
    whereCondition.category = category;
  }

  const { rows, count } = await Podcast.findAndCountAll({
    where: whereCondition,

    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM episode AS e
            WHERE
              e.podcast_id = "Podcast"."podcast_id"
              AND e.is_delete = false
          )`),
          "total_episodes",
        ],
      ],
    },

    include: [
      {
        model: Episode,
        as: "episodes",
        where: { is_delete: false },
        required: false,
        attributes: [
          "episode_id",
          "episode_title",
          "episode_description",
          "episode_audio",
          "createdAt",
          "is_delete",
          "duration",
        ],
      },
    ],

    limit,
    offset,
    distinct: true,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows.map((p: any) => p.toJSON()),
    Pagination: {
      current_page: currentPage,
      records_per_page: limit,
      total_pages: Math.ceil(count / limit),
      total_records: count,
    },
  };
}


// to get podcast by id ====================
export async function getPodcastById(podcast_id: number): Promise<any | null> {
  const podcast = await Podcast.findOne({
    where: {
      podcast_id,
      is_delete: false,
    },
    include: [
      {
        model: Episode,
        as: "episodes",
        where: { is_delete: false },
        required: false,
        attributes: [
          "episode_id",
          "episode_title",
          "episode_description",
          "episode_audio",
          "createdAt",
          "is_delete",
          "duration"
        ],
      },
    ],
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  return podcast.toJSON();
}


// edit podcast ========================================
export async function editPodcast(
  payload: any,
  where: any
): Promise<IPodcast | null> {
  try {
    const podcast = await Podcast.findOne({
      where: { ...where, is_delete: false },
    });

    if (!podcast) return null;

    await podcast.update(payload);

    return podcast.toJSON();
  } catch (err) {
    throw err;
  }
}

// delete podcast =========================================
export async function deletePodcast(payload: any) {
  const podcast_id = Number(payload.podcast_id);

  if (!podcast_id) {
    throw new Error("podcast_id is required");
  }

  const podcast = await Podcast.findOne({
    where: {
      podcast_id,
      is_delete: false,
    },
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  await podcast.update({ is_delete: true });

  await Episode.update({ is_delete: true }, { where: { podcast_id } });

  return { podcast_id };
}

export default {
  createPodcast,
  getAllPodcast,
  getPodcastById,
  editPodcast,
  deletePodcast,
};
