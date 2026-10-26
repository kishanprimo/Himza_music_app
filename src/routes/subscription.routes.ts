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
      payment_method: z.enum(["stripe", "paypal", "razorpay", "apple_iap"])
    })
  ),
  subscribe
);
router.post(
  "/after-payment",
  validateBody(
    z.object({
      plan_id: z.string().min(1, "plan_id is required."),
      // Kept for older app builds; the server checks the real status with the provider.
      payment_status: z.enum(["completed", "failed", "pending"]).optional(),
      payment_method: z.enum(["stripe", "paypal", "razorpay", "apple_iap"]),
      // Stripe: PaymentIntent id or client secret. PayPal: order id.
      // Optional for older app builds (see ALLOW_LEGACY_PAYMENT_CONFIRM).
      payment_reference: z.string().min(1).optional(),
    })
  ),
  afterPayment
);
router.post("/get-user-subscriptions", getUserSubscriptions);

export default router;
