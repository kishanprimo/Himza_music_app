import { Request, Response } from "express";
import EpisodeService from "../services/episode.service";
import { response_service } from "../services";
import formatDuration from "../helpers/durationOfAudio";
// ================= ADD EPISODE =================
// export async function addEpisode(req: Request, res: Response) {
//   try {
//     const audioFile = (req.files as any)?.episode_audio?.[0];

//     if (!audioFile) {
//       return response_service.badRequestResponse(
//         res,
//         "Episode audio file is required"
//       );
//     }

//     const payload = {
//       ...req.body,
//       episode_audio: `uploads/episode_audio/${audioFile.filename}`,
//     };

//     const result = await EpisodeService.createEpisode(payload);

//     return response_service.successResponse(
//       res,
//       "Episode added successfully",
//       result
//     );
//   } catch (err: any) {
//     return response_service.badRequestResponse(res, err.message);
//   }
// }
// export async function addEpisode(req: Request, res: Response) {
//   try {
//     console.log("BODY:", req.body);
//     console.log("FILES:", req.files);

//     const { podcast_title, episode_title, episode_description } = req.body;

//     if (!podcast_title || !episode_title || !episode_description) {
//       return response_service.badRequestResponse(
//         res,
//         "podcast_title, episode_title and episode_description are required"
//       );
//     }

//     const audioFile = (req.files as any)?.episode_audio?.[0];

//     if (!audioFile) {
//       return response_service.badRequestResponse(
//         res,
//         "Episode audio file is required"
//       );
//     }

//     const payload = {
//       podcast_title,
//       episode_title,
//       episode_description,
//       episode_audio: `uploads/episode_audio/${audioFile.filename}`,
//     };

//     const result = await EpisodeService.createEpisode(payload);

//     return response_service.successResponse(
//       res,
//       "Episode added successfully",
//       result
//     );
//   } catch (err: any) {
//     return response_service.badRequestResponse(res, err.message);
//   }
// }
import { parseFile } from "music-metadata";
import path from "path";

export async function addEpisode(req: Request, res: Response) {
  try {
    const { podcast_title, episode_title, episode_description } = req.body;

    if (!podcast_title || !episode_title || !episode_description) {
      return response_service.badRequestResponse(
        res,
        "podcast_title, episode_title and episode_description are required"
      );
    }

    const audioFile = (req.files as any)?.episode_audio?.[0];

    if (!audioFile) {
      return response_service.badRequestResponse(
        res,
        "Episode audio file is required"
      );
    }

    // READ AUDIO METADATA ==================================================================
    const filePath = path.join(audioFile.destination, audioFile.filename);
    const metadata = await parseFile(filePath);

    const durationSeconds = metadata.format.duration || 0;
    const durationFormatted = formatDuration(durationSeconds);
    console.log("durationFormatted", durationFormatted);

    const payload = {
      podcast_title,
      episode_title,
      episode_description,
      episode_audio: `uploads/episode_audio/${audioFile.filename}`,
      duration: durationFormatted,
    };
    const result = await EpisodeService.createEpisode(payload);

    return response_service.successResponse(res, "Episode added successfully", {
      ...result.toJSON(),
      duration_seconds: Math.floor(durationSeconds),
      duration: durationFormatted,
    });
  } catch (err: any) {
    console.error(err);
    return response_service.internalServerErrorResponse(
      res,
      err.message || "Failed to add episode"
    );
  }
}

// ================= GET EPISODES =================
export async function getEpisodeList(req: Request, res: Response) {
  try {
    const page = Number(req.body.page) || 1;
    const limit = Number(req.body.limit) || 10;
    const podcast_id = req.body.podcast_id;
    const podcast_title = req.body.podcast_title;

    const result = await EpisodeService.getEpisodes(
      page,
      limit,
      podcast_id,
      podcast_title
    );

    return response_service.successResponse(
      res,
      "Episodes fetched successfully",
      result
    );
  } catch (err: any) {
    return response_service.badRequestResponse(res, err.message);
  }
}

// =========================== EDIT EPISODES ====================================
export async function editEpisode(req: Request, res: Response) {
  try {
    const { episode_id, episode_title, episode_description } = req.body;

    if (!episode_id) {
      return response_service.badRequestResponse(
        res,
        "episode_id is required."
      );
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    let durationSeconds: number | null = null;
    let durationFormatted: string | null = null;
    let episode_audio: string | undefined;

    // ✅ If new audio uploaded → calculate duration
    if (files?.episode_audio?.[0]) {
      const audioFile = files.episode_audio[0];

      const filePath = path.join(audioFile.destination, audioFile.filename);
      const metadata = await parseFile(filePath);

      durationSeconds = metadata.format.duration || 0;
      durationFormatted = formatDuration(durationSeconds);

      episode_audio = `uploads/episode_audio/${audioFile.filename}`;
    }

    // ✅ Build payload safely
    const payload: any = {
      episode_id,
    };

    if (episode_title) payload.episode_title = episode_title;
    if (episode_description) payload.episode_description = episode_description;
    if (episode_audio) payload.episode_audio = episode_audio;
    if (durationFormatted) payload.duration = durationFormatted;

    const updatedEpisode = await EpisodeService.editEpisode(payload);

    return response_service.successResponse(
      res,
      "Episode updated successfully.",
      {
        ...updatedEpisode.toJSON(),
        ...(durationSeconds !== null && {
          duration: durationFormatted,
          // duration_seconds: Math.floor(durationSeconds),
        }),
      }
    );
  } catch (err: any) {
    console.error(err);
    return response_service.internalServerErrorResponse(
      res,
      err.message || "Failed to update episode"
    );
  }
}

// delete episode ============================================
export async function deleteEpisode(req: Request, res: Response) {
  try {
    if (!req.body.episode_id) {
      return response_service.badRequestResponse(
        res,
        "episode_id is required."
      );
    }

    const result = await EpisodeService.deleteEpisode(req.body);

    return response_service.successResponse(
      res,
      "Episode deleted successfully",
      result
    );
  } catch (error: any) {
    if (error.message === "Episode not found") {
      return response_service.notFoundResponse(res, error.message);
    }

    return response_service.internalServerErrorResponse(
      res,
      error.message || "Internal server error"
    );
  }
}


