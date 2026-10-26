import { z } from 'zod';


export const uploadMusicSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title is required"),

  category_id: z.string().optional(),

  genre_id: z.string().optional(),

  artist_ids: z
    .array(z.string())
    .optional(),

  album_ids: z
    .array(z.string())
    .optional(),
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
        .optional(),
    artist_ids: z.preprocess(
    (value) => {
        if (typeof value === "string") {
            return JSON.parse(value);
        }
        return value;
    },
    z.array(z.number()).optional()
)
    
});
