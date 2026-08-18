import { IMovie, ISong } from "../types";
import db from "../models";

const { Movie, MovieSongConnection, Song } = db;
async function getAllMovies(page: number = 1, limit: number = 10, include?: any): Promise<{ movies: any[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
        const offset = (page - 1) * limit;

        const  movies  = await Movie.findAll({
            include,
            where: { is_deleted: false },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });
        const total = movies.length;
        return {
            movies,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (err) {
        throw err;
    }
}

async function createMovie(data: any) {
    try {
        const movie = await Movie.create(data);
        return movie.toJSON();
    } catch (err) {
        throw err;
    }
}

async function getMovie(movieId: number, include?: any): Promise<IMovie | null> {
    try {
        const movie = await Movie.findOne({ where: { movie_id: movieId }, include });
        if (!movie) return null;
        return movie.toJSON();
    } catch (err) {
        throw err;
    }
}

async function updateMovie(movieId: number, data: any): Promise<IMovie | null> {
    try {
        const movie = await Movie.update(data, { where: { movie_id: movieId }, returning: true });
        if (movie[1] && movie[1].length <= 0) return null;
        return movie[1][0].toJSON();
    } catch (err) {
        throw err;
    }
}

async function deleteMovie(movieId: number): Promise<null> {
    try {
        const movie = await Movie.update({ is_deleted: true }, { where: { movie_id: movieId }, returning: true });
        if (movie[1].length <= 0) return null;
        return movie[1][0].toJSON();
    } catch (err) {
        throw err;
    }
}

async function addSongsToMovie(songIds: string[], movieId: number): Promise<ISong[] | null> {
    try {
        const songs = await Promise.all(songIds.map((song_id: string) => MovieSongConnection.create({ movie_id: movieId, song_id: song_id })));
        return songs.map(s => s.toJSON());
    }
    catch (err) {
        throw err;
    }
}

async function removeSongsFromMovie(songIds: string[], movieId: number): Promise<number[] | null> {
    try {
        const songs = await Promise.all(songIds.map(async (song_id: string) => await MovieSongConnection.destroy({ where: { movie_id: movieId, song_id: song_id } })));
        return songs;
    }
    catch (err) {
        throw err;
    }
}

async function songIsInAnyMovie(songId: number): Promise<boolean> {
    try {
        const song = await MovieSongConnection.findOne({ where: { song_id: songId } });
        return !!song;
    } catch (err) {
        throw err;
    }
}

export default {
    getAllMovies,
    createMovie,
    getMovie,
    updateMovie,
    deleteMovie,
    addSongsToMovie,
    removeSongsFromMovie,
    songIsInAnyMovie
};