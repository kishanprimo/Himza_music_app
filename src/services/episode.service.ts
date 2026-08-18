import db from "../models";
import { Op } from "sequelize";

const { Episode, Podcast } = db;

// ================= ADD EPISODE =================
export async function createEpisode(payload: any) {
  const {
    podcast_title,
    episode_title,
    episode_description,
    episode_audio,
    duration,
  } = payload;

  if (!episode_title || !episode_description) {
    throw new Error("Episode title and description are required");
  }

  const podcast = await Podcast.findOne({
    where: {
      title: { [Op.iLike]: podcast_title },
      is_delete: false,
    },
  });

  if (!podcast) {
    throw new Error("Podcast not found");
  }

  return await Episode.create({
    podcast_id: podcast.podcast_id,
    episode_title,
    episode_description,
    episode_audio,
    duration, // ✅ STORED
  });
}


// ================= GET EPISODES =================
export async function getEpisodes(
  page: number = 1,
  limit: number = 10,
  podcast_id?: number,
  podcast_title?: string
) {
  const offset = (page - 1) * limit;

  // 🎯 Condition builder
  let podcastWhere: any = { is_delete: false };

  if (podcast_id) {
    podcastWhere.podcast_id = podcast_id;
  }

  if (podcast_title) {
    podcastWhere.title = { [Op.iLike]: `%${podcast_title.trim()}%` };
  }

  const { rows, count } = await Episode.findAndCountAll({
    where: { is_delete: false },
    include: [
      {
        model: Podcast,
        as: "podcast",
        where: podcastWhere,
        attributes: ["podcast_id", "title"],
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    Pagination: {
      current_page: page,
      records_per_page: limit,
      total_pages: Math.ceil(count / limit),
      total_records: count,
    },
  };
}

// ======================== EDIT EPISODES ======================
export async function editEpisode(payload: any) {
  const episode = await Episode.findOne({
    where: {
      episode_id: payload.episode_id,
      is_delete: false,
    },
  });

  if (!episode) {
    throw new Error("Episode not found");
  }

  await episode.update(payload);

  return episode;
}


// delete episode =====================================
export async function deleteEpisode(payload: any) {
  const episode_id = Number(payload.episode_id);

  const episode = await Episode.findOne({
    where: {
      episode_id,
    },
  });

  if (!episode) {
    throw new Error("Episode not found");
  }

  await episode.update({ is_delete: true });

  return { episode_id };
}

export default {
  createEpisode,
  getEpisodes,
  editEpisode,
  deleteEpisode,
};
