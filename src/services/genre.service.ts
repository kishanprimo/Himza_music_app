import { Order, Sequelize } from "sequelize";
import db from "../models";

const {
  Genre,
  Movie,
  MovieSongConnection,
  MusicSinger,
  song,
  User,
  favorites,
  Downloads
} = db;
import { IGenre } from "../types";

async function getAllGenres(
  page: number = 1,
  pageSize: number = 10,
  sort_by?: string,
  sort_order?: string,
  for_website: boolean = true
): Promise<{ data: IGenre[]; Pagination: any }> {
  try {
    const offset = (page - 1) * pageSize;
    const order: Order = [];
    if (sort_by && sort_order) {
      const direction = sort_order.toUpperCase() === "DESC" ? "DESC" : "ASC";
      order.push([Sequelize.col(sort_by), direction]);
    }
    const { rows: genres, count: total } = await Genre.findAndCountAll({
      where: { is_deleted: false, ...(for_website ? { status: true } : {}) },
      limit: pageSize,
      offset,
      order,
    });

    return {
      data: genres.map((genre:any) => genre.toJSON()),
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

async function createGenre(
  genrePayload: Partial<IGenre>
): Promise<IGenre | null> {
  try {
    const genre = await Genre.create(genrePayload);
    return genre.toJSON();
  } catch (err) {
    throw err;
  }
}

async function updateGenre(
  genreId: number,
  genrePayload: Partial<IGenre>
): Promise<IGenre | null> {
  try {
    const genre = await Genre.findByPk(genreId);
    if (!genre) return null;
    await genre.update(genrePayload);
    return genre.toJSON();
  } catch (err) {
    throw err;
  }
}

async function removeGenre(genreId: number): Promise<number> {
  try {
    const result = await Genre.update(
      { is_deleted: true },
      { where: { genre_id: genreId } }
    );
    return result[0];
  } catch (err) {
    throw err;
  }
}

async function getSongsByGenre(
  genreId: number,
  page: number = 1,
  pageSize: number = 10,
  userId:number
): Promise<any> {
  try {
    const offset = (page - 1) * pageSize;

    const { rows: songs, count: total } = await song.findAndCountAll({
      where: { genre_id: genreId },
      limit: pageSize,
      offset,
      include: [
        {
          model: Genre,
          as: "genre",
          attributes: ["genre_id", "name", "background_img"],
        },
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
        {
          model: MovieSongConnection,
          as: "movie",
          include: [
            {
              model: Movie,
              as: "movie_details",
            },
          ],
        },
      ],
    });
    const song_counts = await song.count({ where: { genre_id: genreId } });
    
    const data = songs.map((songs: any) => {
      const songJson = songs.toJSON();
       const songId = songs.get("song_id");

    const is_favorite = userId
      ?  favorites.findOne({
          where: { user_id: userId, song_id: songId },
        })
      : null;

    const is_downloaded = userId
      ?  Downloads.findOne({
          where: { user_id: userId, song_id: songId },
        })
      : null;
      return {
        ...songJson,
        is_favorite:!!is_favorite ,
        is_downloaded:!!is_downloaded ,
        genre: {
          ...songJson.genre,
          song_counts: song_counts,
        },
      };
    });
    return {
      data,
      pagination: {
        current_page:page,
        records_per_page:pageSize,
        total_records: total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    throw err;
  }
}

async function getGenreById(genreId: number): Promise<IGenre | null> {
  try {
    const genre = await Genre.findByPk(genreId);
    return genre ? (genre.toJSON() as IGenre) : null;
  } catch (err) {
    throw err;
  }
}

export default {
  getAllGenres,
  createGenre,
  removeGenre,
  getSongsByGenre,
  getGenreById,
  updateGenre,
};

