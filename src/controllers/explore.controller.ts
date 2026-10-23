import { explore_service, response_service } from "../services";
import { Request, Response } from "express";
import { logger } from "../utils";

export async function search(req: Request, res: Response) {
  try {
    const { query, type, page = 1, limit = 10 } = req.body;
    const searchResults = await explore_service.search(
      req.user.user_id,
      query,
      type,
      page,
      limit
    );
    // if (!searchResults || searchResults.length === 0) {
    //   return response_service.notFoundResponse(
    //     res,
    //     "No results found for the given query."
    //   );
    // }
    return response_service.successResponse(
      res,
      "Search results retrieved successfully.",
      searchResults
    );
  } catch (err: any) {
    logger.error("Error during search:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}
