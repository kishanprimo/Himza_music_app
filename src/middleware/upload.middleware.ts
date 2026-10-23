import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { token_service } from "../services";

// === STORAGE CONFIG ===

const DESTINATIONS: Record<string, string> = {
  album_thumbnail: "uploads/album_thumbnails/",
  audio: "uploads/songs/",
  thumbnail: "uploads/thumbnails/",
  profile_pic: "uploads/profile_pics/",
  poster: "uploads/movie_poster/",
  genre_background_img: "uploads/genre_background_img/",
  ad_banner: "uploads/ad_banner/",
  ad_video: "uploads/ad_video/",
  ad_audio: "uploads/ad_audio/",
  logo_light: "uploads/configs/",
  logo_dark: "uploads/configs/",
  podcast_image: "uploads/podcast/",
  episode_audio: "uploads/episode_audio",
};

const storage = multer.diskStorage({
  // Multer only auto-creates the folder when `destination` is a string, not a function.
  destination: (req, file, cb): void => {
    const dir = DESTINATIONS[file.fieldname] ?? "uploads/anonymous/";
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  // Random name + checked extension: the original name is never trusted.
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${randomUUID()}${fileExtension(file)}`);
  },
});

// === FILE FILTER ===

const MB = 1024 * 1024;

type FileRule = { exts: string[]; mimePrefixes: string[]; maxBytes: number };

const IMAGE: FileRule = {
  exts: [".jpg", ".jpeg", ".jfif", ".png", ".webp", ".gif", ".heic", ".heif", ".avif", ".bmp"],
  mimePrefixes: ["image/"],
  // Production had no size limit; keep these generous so existing uploads still work.
  maxBytes: 50 * MB,
};
// Logos may be SVG; only admins can upload them.
const LOGO: FileRule = { ...IMAGE, exts: [...IMAGE.exts, ".svg"] };
const AUDIO: FileRule = {
  exts: [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".oga", ".opus", ".flac", ".mpeg", ".mpga", ".wma", ".aiff", ".aif", ".amr", ".mp4"],
  mimePrefixes: ["audio/", "video/mp4", "video/mpeg"], // some devices label audio as video/*
  maxBytes: 1024 * MB,
};
const VIDEO: FileRule = {
  exts: [".mp4", ".webm", ".ogg", ".mov", ".m4v", ".mkv", ".avi", ".3gp"],
  mimePrefixes: ["video/"],
  maxBytes: 2048 * MB,
};

const FIELD_RULES: Record<string, FileRule> = {
  audio: AUDIO,
  thumbnail: IMAGE,
  album_thumbnail: IMAGE,
  profile_pic: IMAGE,
  poster: IMAGE,
  genre_background_img: IMAGE,
  ad_banner: IMAGE,
  ad_video: VIDEO,
  ad_audio: AUDIO,
  logo_light: LOGO,
  logo_dark: LOGO,
  podcast_image: IMAGE,
  episode_audio: AUDIO,
};

// Used when a client sends a file name without an extension.
const EXT_FROM_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/aac": ".aac",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/ogg": ".ogg",
  "audio/flac": ".flac",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

function fileExtension(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext) return ext;
  const fromMime = EXT_FROM_MIME[(file.mimetype || "").toLowerCase()] ?? "";
  // .m4a / .mp4 audio fields: keep an audio extension.
  return fromMime === ".mp4" && FIELD_RULES[file.fieldname] === AUDIO ? ".m4a" : fromMime;
}

const MAX_FILE_BYTES =Math.max(...Object.values(FIELD_RULES).map((r) => r.maxBytes));

// The extension decides how /uploads serves the file, so it is the main check
// (blocks .html/.js/.svg-as-image etc.). Mobile clients sometimes send
// application/octet-stream, so that MIME type is allowed too.
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const rule = FIELD_RULES[file.fieldname];
  const ext = fileExtension(file);
  const mime = (file.mimetype || "").toLowerCase();

  const extOk = !!rule && rule.exts.includes(ext);
  const mimeOk =
    !!rule &&
    (mime === "application/octet-stream" ||
      rule.mimePrefixes.some((prefix) => mime.startsWith(prefix)));

  if (extOk && mimeOk) return cb(null, true);
  cb(new Error(`Invalid file type for ${file.fieldname}.`));
};

// === MULTER CONFIG ===

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_BYTES,
  },
});

const uploadFields = upload.fields(
  Object.keys(FIELD_RULES).map((name) => ({ name, maxCount: 1 }))
);
// Still parses text fields of multipart requests, but rejects any file.
const noFiles = upload.none();

// Accepts a valid user or admin token (both are checked again by the route's own auth).
function hasValidToken(req: Request): boolean {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return false;
  try {
    const payload: any = token_service.verifyToken(token);
    return !!(payload?.user_id || payload?.admin_id);
  } catch {
    return false;
  }
}

// Removes files that passed the type check but are over their field's size limit.
function rejectOversized(req: Request): string | null {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  if (!files) return null;

  let error: string | null = null;
  for (const [field, list] of Object.entries(files)) {
    for (const file of list) {
      if (file.size > FIELD_RULES[field].maxBytes) {
        error = `${field} is too large. Max ${FIELD_RULES[field].maxBytes / MB} MB.`;
      }
    }
  }
  if (error) {
    for (const list of Object.values(files)) {
      for (const file of list) fs.unlink(file.path, () => {});
    }
  }
  return error;
}

// === MIDDLEWARE EXPORT ===

export const uploadDocs = (req: Request, res: Response, next: NextFunction) => {
  // Only logged-in users/admins may upload files; everyone else gets text fields only.
  const parser = hasValidToken(req) ? uploadFields : noFiles;

  parser(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "Multer error: " + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    const sizeError = rejectOversized(req);
    if (sizeError) {
      return res.status(400).json({ error: sizeError });
    }

    next();
  });
};
