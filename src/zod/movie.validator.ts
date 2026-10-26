import z from 'zod';

export const createMovieSchema = z.object({
    title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title is required'),
    description: z
        .string({ required_error: 'Description is required' })

});

export const updateMovieSchema = z.object({
    movie_id: z.string({ required_error: 'movie_id is required' }),
    title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title is required')
        .optional(),
    description: z
        .string({ required_error: 'Description is required' })
        .optional()
});

export const addOrRemoveSongsFromMovieSchema = z.object({
    movie_id: z.string({ required_error: 'movie_id is required' }),
    songIds: z
        .array(z.string())
        .min(1, 'At least one song is required')
})