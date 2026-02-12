import { Router } from "express";
import { validateBody } from "../middleware/zod.middleware";
import {
  getAllPlans,
  subscribe,
  afterPayment,
  getUserSubscriptions,
} from "../controllers/subscription.controller";
import z from "zod";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/get-subscription-plans", getAllPlans);

router.use(authenticate);
router.post(
  "/subscribe",
  validateBody(
    z.object({
      plan_id: z.string().min(1, "plan_id is required."),
      payment_method: z.enum(["stripe", "paypal"]),
    })
  ),
  subscribe
);
router.post(
  "/after-payment",
  validateBody(
    z.object({
      plan_id: z.string().min(1, "plan_id is required."),
      payment_status: z.enum(["completed", "failed", "pending"]),
      payment_method: z.enum(["stripe", "paypal"]),
    })
  ),
  afterPayment
);
router.post("/get-user-subscriptions", getUserSubscriptions);

export default router;
