import {z} from 'zod';

export const paginationSchema = z.object({
    page: z
        .string({ required_error: 'Page number is required' })
        .min(1, 'Page number must be at least 1')
        .default('1'),
    limit: z
        .string({ required_error: 'Limit is required' })
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit must not exceed 100')
        .default('10'),
});