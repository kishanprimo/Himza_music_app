import { Request, Response, NextFunction } from "express";
import { token_service, user_service } from "../services";

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const { user_id } = token_service.verifyToken(token);

      if (user_id) {
        const user = await user_service.getUser({ user_id });

        if (user) {
          req.user = user; // 👈 same as authenticate
        }
      }
    }

    next(); // always continue
  } catch (err) {
    next(); // ignore error
  }
};