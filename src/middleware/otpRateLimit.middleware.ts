import { Request, Response, NextFunction } from "express";
import { response_service } from "../services";

// Limits how often an OTP can be sent to the same email / mobile number.
// Keyed by the target (not IP), so it works behind a proxy and protects the
// account being attacked. In-memory: per server process.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;

const sends = new Map<string, number[]>();

export const otpSendLimit = (req: Request, res: Response, next: NextFunction) => {
  const target = req.body?.email || req.body?.mobile_number;
  // Google / Apple login sends no OTP.
  if (!target || ["google", "apple"].includes(req.body?.login_type)) return next();

  const now = Date.now();
  const key = String(target).trim().toLowerCase();
  const recent = (sends.get(key) || []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_SENDS_PER_WINDOW) {
    return response_service.generalResponse(
      res,
      false,
      "Too many OTP requests. Please try again later.",
      429
    );
  }

  recent.push(now);
  sends.set(key, recent);
  next();
};

// Drop stale entries so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of sends) {
    if (times.every((t) => now - t >= WINDOW_MS)) sends.delete(key);
  }
}, WINDOW_MS).unref();
