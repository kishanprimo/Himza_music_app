import db from "../models";

const { Album, Genre, HomeBlocks, MusicSinger, song, User, Downloads, favorites, favoriteArtists, favoriteAlbums } = db;
import { IHomeBlocks, ISong } from "../types";
import removeExtraFields from "./common/removeExtraFields.service";
import { genre_category_service, user_service } from ".";
import { Sequelize } from "sequelize";
import { Op, fn, col } from "sequelize";

async function getAllSongsByGenre(
  page: number = 1,
  pageSize: number = 10,
  userId: number,
): Promise<any[]> {
  try {
    const offset = (page - 1) * pageSize;
    const genres = await Genre.findAll({
      limit: pageSize,
      offset,
    });
    return genres.map((genre: any) => genre.toJSON());
  } catch (err) {
    throw err;
  }
}

async function addBlockold(
  blockPayload: Partial<IHomeBlocks>
): Promise<IHomeBlocks> {
  try {
    const { type } = blockPayload;

    if (!type) {
      throw new Error("Block type is required.");
    }

    const hasAlbumIds = blockPayload.album_ids?.length;
    const hasSongIds = blockPayload.song_ids?.length;
    const hasGenreIds = blockPayload.genre_ids?.length;
    const hasArtistIds = blockPayload.artist_ids?.length;

    if (type === "album") {
      if (hasSongIds || hasGenreIds || hasArtistIds) {
        throw new Error(
          "For album type, only album_ids are allowed."
        );
      }
    }

    if (type === "song") {
      if (hasAlbumIds || hasGenreIds || hasArtistIds) {
        throw new Error(
          "For song type, only song_ids are allowed."
        );
      }
    }

    if (type === "genre") {
      if (hasAlbumIds || hasSongIds || hasArtistIds) {
        throw new Error(
          "For genre type, only genre_ids are allowed."
        );
      }
    }

    if (type === "artist") {
      if (hasAlbumIds || hasSongIds || hasGenreIds) {
        throw new Error(
          "For artist type, only artist_ids are allowed."
        );
      }
    }

    // mix → allow everything

    const block = await HomeBlocks.create(blockPayload);
    return block.toJSON();
  } catch (err) {
    throw err;
  }
}

async function addBlock(
  blockPayload: Partial<IHomeBlocks>
): Promise<IHomeBlocks> {
  try {
    const { type } = blockPayload;

    if (!type) {
      throw new Error("Block type is required.");
    }

    const hasAlbumIds = blockPayload.album_ids?.length;
    const hasSongIds = blockPayload.song_ids?.length;
    const hasGenreIds = blockPayload.genre_ids?.length;
    const hasArtistIds = blockPayload.artist_ids?.length;

    if (type === "album") {
      if (hasSongIds || hasGenreIds || hasArtistIds) {
        throw new Error(
          "For album type, only album_ids are allowed."
        );
      }
    }

    if (type === "song") {
      if (hasAlbumIds || hasGenreIds || hasArtistIds) {
        throw new Error(
          "For song type, only song_ids are allowed."
        );
      }
    }

    if (type === "genre") {
      if (hasAlbumIds || hasSongIds || hasArtistIds) {
        throw new Error(
          "For genre type, only genre_ids are allowed."
        );
      }
    }

    if (type === "artist") {
      if (hasAlbumIds || hasSongIds || hasGenreIds) {
        throw new Error(
          "For artist type, only artist_ids are allowed."
        );
      }
    }

    // Get maximum order_id from active blocks
    const maxOrderId = await HomeBlocks.max("order_id", {
      where: {
        is_deleted: false,
      },
    });

    const newOrderId =
      maxOrderId !== null && maxOrderId !== undefined
        ? Number(maxOrderId) + 1
        : 1;

    const block = await HomeBlocks.create({
      ...blockPayload,
      order_id: newOrderId,
    });

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
    const updatedRows = await HomeBlocks.update(blockPayload, {
      where: { block_id: blockId },
    });

    if (!updatedRows[0]) return null;

    const updatedBlock = await HomeBlocks.findByPk(blockId);

    return updatedBlock ? updatedBlock.toJSON() : null;
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
      blocks: rows.map((block: any) => block.toJSON() as Partial<IHomeBlocks>),
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
  pageSize: number = 20,
  userId: number,
): Promise<Partial<IHomeBlocks> | null> {

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

    // album block ===========================================
    if (block.type === "album" || (isMix && limits["album"])) {
      if (limits["album"]) {
        start = (page - 1) * limits["album"];
        end = start + limits["album"];
      }
      const allIds = block.album_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;

      // const albums = await Promise.all(
      //   paginatedIds.map((id: number) => Album.findByPk(id))
      // );
      // data.push(
      //   ...albums.map((album: any) => ({
      //     album_id: album?.album_id,
      //     thumbnail: album?.thumbnail,
      //     title: album?.title,
      //     subtitle: album?.subtitle,
      //     description: album?.description,
      //   }))
      // );


      const albums = paginatedIds.length
        ? await Album.findAll({
          where: { album_id: { [Op.in]: paginatedIds } },
          attributes: [
            "album_id",
            "thumbnail",
            "title",
            "subtitle",
            "description",
          ],
        })
        : [];

      const favoriteAlbumRows = userId && paginatedIds.length
        ? await favoriteAlbums.findAll({
          where: {
            user_id: userId,
            album_id: { [Op.in]: paginatedIds },
          },
          attributes: ["album_id"],
          raw: true,
        })
        : [];

      const favoriteAlbumIds = new Set(
        favoriteAlbumRows.map((item: any) => Number(item.album_id))
      );

      const albumMap = new Map(
        // get({ plain: true }) keeps the model getters (thumbnail URL prefix).
        albums.map((item: any) => {
          const album = item.get({ plain: true });
          return [Number(album.album_id), album];
        })
      );

      data.push(
        ...paginatedIds
          .map((id: number) => {
            const album: any = albumMap.get(Number(id));
            if (!album) return null;

            return {
              ...album,
              is_favorite: favoriteAlbumIds.has(Number(id)),
            };
          })
          .filter(Boolean)
      );
    }
    // song block ===========================================
    if (block.type === "song" || (isMix && limits["song"])) {
      if (limits["song"]) {
        start = (page - 1) * limits["song"];
        end = start + limits["song"];
      }
      const allIds = block.song_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;

      // const songs = await Promise.all(
      //   paginatedIds.map(async (id: number) => {

      //     console.log("FETCHING SONG ID:", id);

      //     const Song = (await song.findByPk(id, {
      //       include: [
      //         {
      //           model: MusicSinger,
      //           as: "artists",
      //           include: [
      //             {
      //               model: User,
      //               as: "singer",
      //               attributes: ["full_name", "profile_pic"],
      //             },
      //           ],
      //         },
      //       ],
      //     })) as Partial<ISong>;

      //     console.log("FOUND SONG:", {
      //       id,
      //       song_id: Song?.song_id,
      //       title: Song?.title,
      //       audio: Song?.audio,
      //     });

      //     const is_favorite = await favorites.findOne({
      //       where: { user_id: userId, song_id: id },
      //     });
      //     const is_downloaded = await Downloads.findOne({
      //       where: { user_id: userId, song_id: id },
      //     });

      //     if (!Song) {
      //       console.log("❌ SONG NOT FOUND:", id);
      //       return null;
      //     }
      //     return {
      //       song_id: Song.song_id,
      //       is_favorite: !!is_favorite,
      //       is_downloaded: !!is_downloaded,
      //       thumbnail: Song.thumbnail,
      //       audio: Song.audio,
      //       title: Song.title,
      //       artists: {
      //         artist:
      //           Song.artists?.map((artist: any) => ({
      //             user_id: artist.user_id,
      //             full_name: artist.singer.full_name,
      //             profile_pic: artist.singer.profile_pic,
      //           })) || [],
      //       },
      //     };
      //   })
      // );

      // console.log("FINAL SONGS:", songs);



      // data.push(...songs.filter(Boolean)); // filter out nulls


      const songs = paginatedIds.length
        ? await song.findAll({
          where: { song_id: { [Op.in]: paginatedIds } },
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
        })
        : [];

      const [favoriteRows, downloadedRows] = userId && paginatedIds.length
        ? await Promise.all([
          favorites.findAll({
            where: {
              user_id: userId,
              song_id: { [Op.in]: paginatedIds },
            },
            attributes: ["song_id"],
            raw: true,
          }),
          Downloads.findAll({
            where: {
              user_id: userId,
              song_id: { [Op.in]: paginatedIds },
            },
            attributes: ["song_id"],
            raw: true,
          }),
        ])
        : [[], []];

      const favoriteSongIds = new Set(
        favoriteRows.map((item: any) => Number(item.song_id))
      );

      const downloadedSongIds = new Set(
        downloadedRows.map((item: any) => Number(item.song_id))
      );

      const songMap = new Map(
        songs.map((item: any) => {
          const plainSong = item.get({ plain: true });
          return [Number(plainSong.song_id), plainSong];
        })
      );

      data.push(
        ...paginatedIds
          .map((id: number) => {
            const Song: any = songMap.get(Number(id));
            if (!Song) return null;

            return {
              song_id: Song.song_id,
              is_favorite: favoriteSongIds.has(Number(id)),
              is_downloaded: downloadedSongIds.has(Number(id)),
              thumbnail: Song.thumbnail,
              audio: Song.audio,
              title: Song.title,
              artists: {
                artist:
                  Song.artists?.map((artist: any) => ({
                    user_id: artist.user_id,
                    full_name: artist.singer?.full_name,
                    profile_pic: artist.singer?.profile_pic,
                  })) || [],
              },
            };
          })
          .filter(Boolean)
      );

    }

    // genre block ============================================
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

    // artist block =============================================
    if (block.type === "artist" || (isMix && limits["artist"])) {
      if (limits["artist"]) {
        start = (page - 1) * limits["artist"];
        end = start + limits["artist"];
      }

      const allIds = block.artist_ids || [];
      const paginatedIds = allIds.slice(start, end);
      total += allIds.length;


      const artists = paginatedIds.length
        ? await User.findAll({
          where: { user_id: { [Op.in]: paginatedIds } },
          attributes: ["user_id", "full_name", "profile_pic"],
        })
        : [];

      const [songsCounts, favoriteArtistRows] = paginatedIds.length
        ? await Promise.all([
          MusicSinger.findAll({
            attributes: [
              "user_id",
              [fn("COUNT", col("user_id")), "total"],
            ],
            where: { user_id: { [Op.in]: paginatedIds } },
            group: ["user_id"],
            raw: true,
          }),
          userId
            ? favoriteArtists.findAll({
              where: {
                user_id: userId,
                artist_user_id: { [Op.in]: paginatedIds },
              },
              attributes: ["artist_user_id"],
              raw: true,
            })
            : [],
        ])
        : [[], []];

      const artistSongsMap = new Map(
        songsCounts.map((item: any) => [
          Number(item.user_id),
          Number(item.total),
        ])
      );

      const favoriteArtistIds = new Set(
        favoriteArtistRows.map((item: any) => Number(item.artist_user_id))
      );

      const artistMap = new Map(
        // get({ plain: true }) keeps the model getters (profile_pic URL prefix).
        artists.map((item: any) => {
          const artist = item.get({ plain: true });
          return [Number(artist.user_id), artist];
        })
      );

      data.push(
        ...paginatedIds
          .map((id: number) => {
            const artist: any = artistMap.get(Number(id));
            if (!artist) return null;

            return {
              user_id: artist.user_id,
              full_name: artist.full_name,
              profile_pic: artist.profile_pic,
              songs_count: artistSongsMap.get(Number(id)) ?? 0,
              artist_favorite: favoriteArtistIds.has(Number(id)),
            };
          })
          .filter(Boolean)
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

async function reorderBlocks(
  blockOrders: { block_id: string | number; order_id: number }[]
) {
  const transaction = await db.sequelize!.transaction();

  try {
    for (const item of blockOrders) {
      await HomeBlocks.update(
        {
          order_id: Number(item.order_id),
        },
        {
          where: {
            block_id: Number(item.block_id),
          },
          transaction,
        }
      );
    }

    await transaction.commit();

    return blockOrders;
  } catch (error) {
    await transaction.rollback();
    throw error;
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
  reorderBlocks,
};
