import z from "zod";

export const updateUserSchema = z.object({
  user_id: z.string({ required_error: "User ID is required" }).optional(),
  avatar_id: z.string({ required_error: "Avatar ID is required" }).optional(),
  full_name: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name must be less than 50 characters")
    .optional(),
  username: z
    .string({ required_error: "User name is required" })
    .min(2, "User name must be at least 2 characters long")
    .max(50, "User name must be less than 50 characters")
    .optional(),
  gender: z.string({ required_error: "Gender is required" }).optional(),
  dob: z.string({ required_error: "Date of birth is required" }).optional(),
  mobile_number: z
    .string({ required_error: "Mobile number is required" })
    .optional(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .optional(),
  is_singer: z.string({ required_error: "is_singer is required" }).optional(),
  country_code: z
    .string({ required_error: "Country code is required" })
    .optional(),
  account_status: z.enum(["true", "false"]).optional(),
  blocked_by_admin: z.enum(["true", "false"]).optional(),
});

export const updateCurrentSongSchema = z.object({
  current_song_id: z.string({ required_error: "Current song ID is required" }),
  current_song_time: z.string({
    required_error: "Current song time is required",
  }),
  current_album_id: z
    .string({ required_error: "Current album ID is required" })
    .optional(),
});

export const updateSongTimeSchema = z.object({
  current_song_time: z.string({
    required_error: "Current song time is required",
  }),
  history_id: z.string({ required_error: "History ID is required" }),
});

export const validateUsernameSchema = z.object({
  username: z.string({ required_error: "username is required" }),
});
