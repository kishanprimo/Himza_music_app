import { Request, Response } from "express";
import PodcastService from "../services/podcast.service";
import { podcast_service, response_service } from "../services";
import config from "../config/config";

// CREATE PODCAST =====================================
export async function createPodcast(req: Request, res: Response) {
  try {
    const file = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (file?.["podcast_image"]) {
      req.body.podcast_image = `uploads/podcast/${file["podcast_image"][0].filename}`;
    }

    const podcast = await PodcastService.createPodcast(req.body);

    return response_service.successResponse(
      res,
      "Podcast created successfully.",
      podcast
    );
  } catch (error: any) {
    return response_service.internalServerErrorResponse(
      res,
      error.message || "Internal server error"
    );
  }
}

// get all podcast list ==============================
export async function getAllPodcast(req: Request, res: Response) {
  try {
    const page = Number(req.body.page);
    const limit = Number(req.body.limit);
    const search = req.body.search;
    const category = req.body.category;

    const result = await PodcastService.getAllPodcast(page, limit, search,category);

    return response_service.successResponse(
      res,
      "Podcasts fetched successfully.",
      result
    );
  } catch (error: any) {
    return response_service.internalServerErrorResponse(
      res,
      error.message || "Internal server error"
    );
  }
}

// get podcast by id ===============================
export async function getPodcastById(req: Request, res: Response) {
  try {
    const podcast_id = Number(req.body.podcast_id);

    const podcast = await PodcastService.getPodcastById(podcast_id);

    return response_service.successResponse(
      res,
      "Podcast fetched successfully.",
      podcast
    );
  } catch (error: any) {
    return response_service.internalServerErrorResponse(
      res,
      error.message || "Internal server error"
    );
  }
}



// edit podcast ====================================

export async function editPodcast(req: Request, res: Response) {
  try {
    console.log("podcas111t",req.body);
    const { podcast_id, description, author_name } = req.body;
    console.log("podcast",req.body);
    

    if (!podcast_id) {
      return response_service.badRequestResponse(res, "podcast_id is required.");
    }

    const payload: any = {};

    if (typeof description === "string") {
      payload.description = description.trim();
    }

    if (typeof author_name === "string") {
      payload.author_name = author_name.trim();
    }

    if (req.files) {
      const files = req.files as { [key: string]: Express.Multer.File[] };

      if (files?.podcast_image?.[0]) {
        payload.podcast_image = `uploads/podcast/${files.podcast_image[0].filename}`;
      }
    }

    const updatedPodcast = await PodcastService.editPodcast(
      payload,
      { podcast_id }
    );

    if (!updatedPodcast) {
      return response_service.notFoundResponse(res, "Podcast not found.");
    }

    return response_service.successResponse(
      res,
      "Podcast updated successfully.",
      updatedPodcast
    );
  } catch (err: any) {
    return response_service.internalServerErrorResponse(
      res,
      err.message || "Internal server error"
    );
  }
}



// delete podcast ==========================================
export async function deletePodcast(req: Request, res: Response) {
  try {
    if (!req.body.podcast_id) {
      return response_service.badRequestResponse(
        res,
        "podcast_id is required."
      );
    }

    const result = await PodcastService.deletePodcast(req.body);

    return response_service.successResponse(
      res,
      "Podcast deleted successfully",
      result
    );
  } catch (error: any) {
    if (error.message === "Podcast not found") {
      return response_service.notFoundResponse(res, error.message);
    }

    return response_service.internalServerErrorResponse(
      res,
      error.message || "Internal server error"
    );
  }
}


