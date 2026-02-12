import z from 'zod';

export const CreateGenreSchema = z.object({
    name: z.string().min(1, 'Name is required'),
});

export const updateGenreSchema = z.object({
    genre_id: z.string().min(1, 'Genre ID is required'),
    name: z.string().min(1, 'Name is required').optional(),
    status: z.string().min(1, 'Status is required').optional(),
    is_deleted: z.string().min(1, 'Is deleted is required').optional(),
});