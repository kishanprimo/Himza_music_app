import db from "../models";

const { Album, Genre, HomeBlocks, MusicSinger, song, User } = db;
import { IHomeBlocks, ISong } from "../types";
import removeExtraFields from "./common/removeExtraFields.service";
import { genre_category_service, user_service } from ".";
import { Sequelize } from "sequelize";

async function getAllSongsByGenre(
  page: number = 1,
  pageSize: number = 10
): Promise<any[]> {
  try {
    const offset = (page - 1) * pageSize;
    const genres = await Genre.findAll({
      limit: pageSize,
      offset,
    });
    return genres.map((genre:any) => genre.toJSON());
  } catch (err) {
    throw err;
  }
}

async function addBlock(
  blockPayload: Partial<IHomeBlocks>
): Promise<IHomeBlocks> {
  try {
    if (blockPayload.type === "album") {
      blockPayload.song_ids = [];
      blockPayload.genre_ids = [];
      blockPayload.artist_ids = [];
    } else if (blockPayload.type === "song") {
      blockPayload.album_ids = [];
      blockPayload.genre_ids = [];
      blockPayload.artist_ids = [];
    } else if (blockPayload.type === "genre") {
      blockPayload.album_ids = [];
      blockPayload.song_ids = [];
      blockPayload.artist_ids = [];
    } else if (blockPayload.type === "artist") {
      blockPayload.album_ids = [];
      blockPayload.song_ids = [];
      blockPayload.genre_ids = [];
    }
    const block = await HomeBlocks.create(blockPayload);
    return block.toJSON();
  } catch (err) {
    throw err;
  }
}

async function updateBlock(
  blockPayload: Partial<IHomeBlocks>,
  blockId: number
): Promise<IHomeBlocks | null> {
  try {
    const [updatedRows, updatedBlock] = await HomeBlocks.update(blockPayload, {
      where: { block_id: blockId },
      returning: true,
    });
    return updatedRows ? updatedBlock[0].toJSON() : null;
  } catch (err) {
    throw err;
  }
}

async function addDataToBlock(
  blockId: number,
  data: Partial<IHomeBlocks>
): Promise<IHomeBlocks | null> {
  try {
    const block = (await HomeBlocks.findByPk(blockId)) as any;
    if (!block) return null;

    if (block.type === "album" || block.type === "mix") {
      block.album_ids = [...(block.album_ids || []), ...(data.album_ids || [])];
    }
    if (block.type === "song" || block.type === "mix") {
      block.song_ids = [...(block.song_ids || []), ...(data.song_ids || [])];
    }
    if (block.type === "genre" || block.type === "mix") {
      block.genre_ids = [...(block.genre_ids || []), ...(data.genre_ids || [])];
    }
    if (block.type === "artist" || block.type === "mix") {
      block.artist_ids = [
        ...(block.artist_ids || []),
        ...(data.artist_ids || []),
      ];
    }
    await block.save();
    return block.toJSON();
  } catch (err) {
    throw err;
  }
}

async function removeDataFromBlock(
  blockId: number,
  data: Partial<IHomeBlocks>
): Promise<IHomeBlocks | null> {
  try {
    const block = (await HomeBlocks.findByPk(blockId)) as any;
    if (!block) return null;
    if (block.type === "album" || block.type === "mix") {
      block.album_ids = (block.album_ids || []).filter(
        (id: number) =>
          !(data.album_ids || []).map(String).includes(id.toString())
      );
    }
    if (block.type === "song" || block.type === "mix") {
      block.song_ids = (block.song_ids || []).filter(
        (id: number) =>
          !(data.song_ids || []).map(String).includes(id.toString())
      );
    }
    if (block.type === "genre" || block.type === "mix") {
      block.genre_ids = (block.genre_ids || []).filter(
        (id: number) =>
          !(data.genre_ids || []).map(String).includes(id.toString())
      );
    }
    if (block.type === "artist" || block.type === "mix") {
      block.artist_ids = (block.artist_ids || []).filter(
        (id: number) =>
          !(data.artist_ids || []).map(String).includes(id.toString())
      );
    }

    await block.save();
    return block.toJSON();
  } catch (err) {
    throw err;
  }
}

async function getAllBlocks(): Promise<{ blocks: Partial<IHomeBlocks>[] }> {
  try {
    const { count, rows } = await HomeBlocks.findAndCountAll({
      where: { is_deleted: false },
      order: [["order_id", "ASC"]],
      attributes: [
        "block_id",
        "type",
        "title",
        "subtitle",
        "order_id",
        "is_visible",
        [
          Sequelize.literal('COALESCE(array_length("album_ids", 1), 0)'),
          "album_count",
        ],
        [
          Sequelize.literal('COALESCE(array_length("song_ids", 1), 0)'),
          "song_count",
        ],
        [
          Sequelize.literal('COALESCE(array_length("genre_ids", 1), 0)'),
          "genre_count",
        ],
        [
          Sequelize.literal('COALESCE(array_length("artist_ids", 1), 0)'),
          "artist_count",
        ],
      ],
    });

    return {
      blocks: rows.map((block:any) => block.toJSON() as Partial<IHomeBlocks>),
    };
  } catch (err) {
    throw err;
  }
}
// get particular block data =============================================
async function getBlock(
  blockId: number,
  limits: { album?: number; song?: number; genre?: number; artist?: number },
  page: number = 1,
  pageSize: number = 20
): Promise<Partial<IHomeBlocks> | null> {
  console.log("getBlock called with:", { blockId });
  try {
    const block = (await HomeBlocks.findByPk(blockId)) as any;
    if (!block) return null;

    let start = (page - 1) * pageSize;
    let end = start + pageSize;

    let data: any[] = [];
    let total = 0;
    let album_count = block.album_ids?.length ?? 0,
      song_count = block.song_ids?.length ?? 0,
      genre_count = block.genre_ids?.length ?? 0,
      artist_count = block.artist_ids?.length ?? 0;
    const isMix = block.type === "mix";
    if (block.type === "album" || (isMix && limits["album"])) {
      if (limits["album"]) {
        start = (page - 1) * limits["album"];
        end = start + limits["album"];
      }
      const allIds = block.album_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;

      const albums = await Promise.all(
        paginatedIds.map((id: number) => Album.findByPk(id))
      );
      data.push(
        ...albums.map((album: any) => ({
          album_id: album?.album_id,
          thumbnail: album?.thumbnail,
          title: album?.title,
          subtitle: album?.subtitle,
          description: album?.description,
        }))
      );
    }

    if (block.type === "song" || (isMix && limits["song"])) {
      if (limits["song"]) {
        start = (page - 1) * limits["song"];
        end = start + limits["song"];
      }
      const allIds = block.song_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;

      const songs = await Promise.all(
        paginatedIds.map(async (id: number) => {
          const Song = (await song.findByPk(id, {
            include: [
              {
                model: MusicSinger,
                as: "artists",
                include: [
                  {
                    model: User,
                    as: "singer",
                    attributes: ["full_name", "profile_pic"],
                  },
                ],
              },
            ],
          })) as Partial<ISong>;

          if (!Song) return null;
          return {
            song_id: Song.song_id,
            thumbnail: Song.thumbnail,
            audio: Song.audio,
            title: Song.title,
            artists: {
              artist:
                Song.artists?.map((artist: any) => ({
                  user_id: artist.user_id,
                  full_name: artist.singer.full_name,
                  profile_pic: artist.singer.profile_pic,
                })) || [],
            },
          };
        })
      );

      data.push(...songs.filter(Boolean)); // filter out nulls
    }

    if (block.type === "genre" || (isMix && limits["genre"])) {
      if (limits["genre"]) {
        start = (page - 1) * limits["genre"];
        end = start + limits["genre"];
      }
      const allIds = block.genre_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;

      const genres = await Promise.all(
        paginatedIds.map((id: number) =>
          genre_category_service.getGenreById(id)
        )
      );
      data.push(
        ...genres.map((genre: any) => ({
          genre_id: genre?.genre_id,
          name: genre?.name,
          background_img: genre?.background_img,
        }))
      );
    }

    if (block.type === "artist" || (isMix && limits["artist"])) {
      if (limits["artist"]) {
        start = (page - 1) * limits["artist"];
        end = start + limits["artist"];
      }
      const allIds = block.artist_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;
      const artists = await Promise.all(
        paginatedIds.map((id: number) =>
          user_service.getUser({ user_id: id.toString() })
        )
      );
      data.push(
        ...(await Promise.all(
          artists.map(async (artist: any) => {
            const songs_count = await MusicSinger.count({
              where: { user_id: artist["user_id"] },
            });
            return {
              user_id: artist["user_id"],
              full_name: artist["full_name"],
              profile_pic: artist["profile_pic"],
              songs_count,
            };
          })
        ))
      );
    }

    return {
      block_id: block.block_id,
      title: block.title,
      subtitle: block.subtitle,
      description: block.description,
      type: block.type,
      album_count,
      song_count,
      genre_count,
      artist_count,
      is_visible: block.is_visible,
      order_id: block.order_id,
      data: data.sort(() => Math.random() - 0.5),
      pagination: {
        page: parseInt(page.toString()),
        pageSize: parseInt(
          isMix ? data.length.toString() : pageSize.toString()
        ),
        total: parseInt(total.toString()),
        totalPages: Math.ceil(total / pageSize),
      },
    } as Partial<IHomeBlocks>;
  } catch (err) {
    throw err;
  }
}

export default {
  getAllSongsByGenre,
  addBlock,
  updateBlock,
  addDataToBlock,
  removeDataFromBlock,
  getAllBlocks,
  getBlock,
};
