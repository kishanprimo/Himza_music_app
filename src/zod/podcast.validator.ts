import { z } from "zod";

export const editPodcastSchema = z.object({
    podcast_id: z.string().min(1, "podcast_id is required"),
    description: z.string().optional(),
    author_name: z.string().optional(),
})

export const addEpisodeSchema = z.object({
    podcast_title: z.string().min(1, "podcast_title is required"),
})

export const editEpisodeSchema = z.object({
    episode_id: z.string().min(1, "episode_id is required"),
})

export const deleteEpisodeSchema = z.object({
    episode_id: z.string().min(1, "episode_id is required"),
})

export const deletePodcastSchema = z.object({
    podcast_id: z.string().min(1, "podcast_id is required"),
})