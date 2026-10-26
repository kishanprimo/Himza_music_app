import { Request, Response, NextFunction } from "express";
import { token_service, user_service, admin_service } from "../services";

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

// Sets req.user only when a valid admin token is sent; never blocks the request.
export const optionalAdminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const { admin_id } = token_service.verifyAdminToken(token);

      if (admin_id) {
        const admin = await admin_service.getAdmin({ admin_id });

        if (admin) {
          req.user = admin;
        }
      }
    }

    next();
  } catch (err) {
    next();
  }
};