import { Request, Response, NextFunction } from "express";
import {
  response_service,
  user_service,
  token_service,
  admin_service,
} from "../services";
// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    const { user_id } = token_service.verifyToken(token);
    if (!user_id) {
      throw new Error();
    }
    const user = await user_service.getUser({ user_id: user_id });
    if (!user) {
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error: any) {
    return response_service.forbiddenResponse(
      res,
      error.message || "Authentication failed. Please log in again."
    );
  }
};

export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new Error();
    }
    const { admin_id } = token_service.verifyAdminToken(token);
    if (!admin_id) {
      throw new Error();
    }
    const admin = await admin_service.getAdmin({ admin_id: admin_id });
    if (!admin) {
      throw new Error();
    }
    req.user = admin;
    next();
  } catch (error: any) {
    return response_service.forbiddenResponse(
      res,
      error.message || "Authentication failed. Please log in again."
    );
  }
};
