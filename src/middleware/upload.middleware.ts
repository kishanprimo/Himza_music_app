import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";

// === STORAGE CONFIG ===

const storage = multer.diskStorage({
  destination: (req, file, cb): void => {
    const fieldname = file.fieldname;
    console.log("Fieldname !!122",fieldname)
    switch (fieldname) {
      case "album_thumbnail":
        cb(null, "uploads/album_thumbnails/");
        break;
      case "audio":
        cb(null, "uploads/songs/");
        break;
      case "thumbnail":
        cb(null, "uploads/thumbnails/");
        break;
      case "profile_pic":
        cb(null, "uploads/profile_pics/");
        break;
      case "poster":
        cb(null, "uploads/movie_poster/");
        break;
      case "genre_background_img":
        cb(null, "uploads/genre_background_img/");
        break;
      case "ad_banner":
        cb(null, "uploads/ad_banner/");
        break;
      case "ad_video":
        cb(null, "uploads/ad_video/");
        break;
      case "ad_audio":
        cb(null, "uploads/ad_audio/");
        break;
      case "logo_light":
        cb(null, "uploads/configs/");
        break;
      case "logo_dark":
        cb(null, "uploads/configs/");
        break;
      case "podcast_image":
        cb(null, "uploads/podcast/");
        break;
      case "episode_audio":
        cb(null, "uploads/episode_audio");
        break;
      default:
        cb(null, "uploads/anonymous/");
        break;
    }
  },
  filename: function (req, file, cb) {
    return cb(
      null,
      `${Date.now()}-${file.originalname
        .replaceAll("#", "-")
        .replaceAll(",", "-")
        .replaceAll(":", "-")
        .replaceAll(" ", "-")}`
    );
  },
});

// === FILE FILTER ===

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const fieldname = file.fieldname;
  let allowedAudioTypes;
  let allowedImageTypes;
  let allowedVideoTypes;
  cb(null, true);
  // switch (fieldname) {
  //     case 'audio':
  //         // allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
  //         // if (allowedAudioTypes.includes(file.mimetype)) {
  //         // } else {
  //         //     cb(new Error('Invalid audio file type.'));
  //         // }
  //         break;
  //     case 'thumbnail':
  //         cb(null, true);
  //         // allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //         // if (allowedImageTypes.includes(file.mimetype)) {
  //         // } else {
  //         //     cb(new Error('Invalid image file type.'));
  //         // }
  //         break;
  //     case 'album_thumbnail':
  //         allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //         if (allowedImageTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid image file type.'));
  //         }
  //         break;
  //     case 'profile_pic':
  //         allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //         if (allowedImageTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid image file type.'));
  //         }
  //         break;
  //     case 'poster':
  //         allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //         if (allowedImageTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid image file type.'));
  //         }
  //         break;
  //     case 'genre_background_img':
  //         allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //         if (allowedImageTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid image file type.'));
  //         }
  //         break;
  //     case 'ad_banner':
  //         allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  //         if (allowedImageTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid image file type.'));
  //         }
  //         break;
  //     case 'ad_video':
  //         allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  //         if (allowedVideoTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid video file type.'));
  //         }
  //         break;
  //     case 'ad_audio':
  //         allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
  //         if (allowedAudioTypes.includes(file.mimetype)) {
  //             cb(null, true);
  //         } else {
  //             cb(new Error('Invalid audio file type.'));
  //         }
  //         break;
  //     default:
  //         cb(new Error('Unexpected file field.'));
  //         break;
  // }
};

// === MULTER CONFIG ===

const upload = multer({
  storage,
  // fileFilter,
  limits: {
    // fileSize: 100 * 1024 * 1024, // 15MB total
    fileSize:Infinity,
  },
});

// === MIDDLEWARE EXPORT ===

export const uploadDocs = (req: Request, res: Response, next: NextFunction) => {
  const uploadFields = upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
    { name: "album_thumbnail", maxCount: 1 },
    { name: "profile_pic", maxCount: 1 },
    { name: "poster", maxCount: 1 },
    { name: "genre_background_img", maxCount: 1 },
    { name: "ad_banner", maxCount: 1 },
    { name: "ad_video", maxCount: 1 },
    { name: "ad_audio", maxCount: 1 },
    { name: "logo_light", maxCount: 1 },
    { name: "logo_dark", maxCount: 1 },
    { name: "podcast_image", maxCount: 1 },
    { name: "episode_audio", maxCount: 1 },
  ]);
  uploadFields(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "Multer error: " + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    next();
  });
};
