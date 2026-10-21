import z from "zod";

export const broadcastMessageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

export const getBroadcastMessageSchema = z.object({
  page: z.string().optional().default("1"),
  pageSize: z.string().optional().default("10"),
});
