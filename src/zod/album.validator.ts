import { z } from 'zod';

export const createAlbumSchema = z.object({
    genre_id: z
        .string({ required_error: 'genre_id is required' })
        .min(1, 'genre_id is required').optional(),
    title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title is required'),
    songs: z
        .array(z.string())
        .min(1, 'At least one song is required').optional(),
    description: z.string().optional(),
    is_private: z.string({
        required_error: 'is_private is required',
    })
});

export const updateAlbumSchema = z.object({
    album_id: z.string().optional(),
    genre_id: z
        .string({ required_error: 'genre_id is required' })
        .min(1, 'genre_id is required').optional(),
    title: z
        .string({ required_error: 'Title is required' })
        .min(1, 'Title is required').optional(),
    description: z.string().optional(),
    is_private: z.string({
        required_error: 'is_private is required',
    }).optional()
});

export const addOrRemoveSongsFromAlbumSchema = z.object({
    album_id: z.string({ required_error: 'album_id is required' }),
    songIds: z
        .array(z.string())
        .min(1, 'At least one song is required'),
})