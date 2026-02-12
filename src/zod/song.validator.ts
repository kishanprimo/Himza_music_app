import { z } from 'zod';

export const uploadMusicSchema = z.object({
    genre_id: z
        .string({ required_error: 'Genre id is required' }),
    title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title is required'),
    artist_ids: z.
        array(z.string())
        .nonempty({ message: 'At least one artist id is required' }),
    });

export const updateMusicSchema = z.object({
    song_id: z
        .string({ required_error: 'Song id is required' }),
    genre_id: z
        .string({ required_error: 'Genre id is required' })
        .optional(),
    title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title is required')
        .optional(),
    status: z
        .string({ required_error: 'Status is required' })
        .optional()
});
