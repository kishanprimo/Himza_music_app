import z from 'zod';

export const searchSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    type: z.enum(['song', 'artist', 'album', 'genre']).optional(),
    page: z.string().min(1, 'Page number must be a positive integer').default('1'),
    limit: z.string().min(1, 'Limit must be a positive integer').max(100, 'Limit cannot exceed 100').default('10')
});