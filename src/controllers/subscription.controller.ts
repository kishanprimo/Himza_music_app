import { Request, Response } from "express";
import { logger } from "../utils";
import {
  response_service,
  subscription_service,
  user_service,
} from "../services";
import db from "../models";

const { SubscribedUsers, SunscriptionPlans, History, User } = db;
import createOrder, { verifyOrderPaid } from "./paypal.controller";

// get all plans ===============================================================
async function getAllPlans(req: Request, res: Response) {
  try {
    const plans = await subscription_service.getAllPlans();
    if (!plans) {
      return response_service.notFoundResponse(res, "No plans found.");
    }
    return response_service.successResponse(
      res,
      "Plans retrieved successfully.",
      plans
    );
  } catch (err: any) {
    logger.error("Error retrieving plans:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get plan by id ===================================================================
async function getPlanById(req: Request, res: Response) {
  try {
    const plan = await subscription_service.getPlanById(
      parseInt(req.body.plan_id)
    );
    if (!plan) {
      return response_service.notFoundResponse(res, "Plan not found.");
    }
    return response_service.successResponse(
      res,
      "Plan retrieved successfully.",
      plan
    );
  } catch (err: any) {
    logger.error("Error retrieving plan:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// create plan for admin ===============================================================
async function createPlan(req: Request, res: Response) {
  try {
    const plans = await subscription_service.getAllPlans();
    if (plans.length >= 3) {
      return response_service.notFoundResponse(res, "cannot add more plans.");
    }
    const plan = await subscription_service.createPlan(req.body);
    return response_service.successResponse(
      res,
      "Plan created successfully.",
      plan
    );
  } catch (err: any) {
    logger.error("Error creating plan:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// update plan for admin ========================================
async function updatePlan(req: Request, res: Response) {
  try {
    const plan = await subscription_service.updatePlan(req.body, {
      plan_id: req.body.plan_id,
    });
    if (!plan) {
      return response_service.notFoundResponse(res, "Plan not found.");
    }
    return response_service.successResponse(
      res,
      "Plan updated successfully.",
      plan
    );
  } catch (err: any) {
    logger.error("Error updating plan:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// delete plan for admin ===================================================
async function deletePlan(req: Request, res: Response) {
  try {
    const plan = await subscription_service.deletePlan({
      plan_id: req.body.plan_id,
    });
    if (!plan) {
      return response_service.notFoundResponse(res, "Plan not found.");
    }
    return response_service.successResponse(
      res,
      "Plan deleted successfully.",
      plan
    );
  } catch (err: any) {
    logger.error("Error deleting plan:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// subscribe =================================================
async function subscribe(req: Request, res: Response) {
  try {
    // const user = req.user;
    const user = await User.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: SubscribedUsers,
          as: "subscriptionPlan",
          where: { is_active: true },
          required: false, // IMPORTANT
          include: [
            {
              model: SunscriptionPlans,
              as: "plan",
            },
          ],
        },
      ],
    });


    if (!user) {
      return response_service.notFoundResponse(res, "User not found.");
    }
    // if (user.subscriptionPlan ) {
    //   return response_service.badRequestResponse(
    //     res,
    //     "User already has a subscription."
    //   );
    // }
    // subscriptionPlan comes as array
    const activePlans =
      user.subscriptionPlan?.filter(
        (p: any) => p.is_active && new Date(p.expires_at) > new Date()
      ) || [];

    if (activePlans.length > 0) {
      return response_service.badRequestResponse(
        res,
        "User already has an active subscription."
      );
    }
    const subscription_plan_id = req.body.plan_id;
    const plan = await subscription_service.getPlanById(subscription_plan_id);
    if (!plan) {
      return response_service.notFoundResponse(res, "Plan not found.");
    }
    if (req.body.payment_method == "stripe") {
      const stripeIntent = await subscription_service.createStripeIntent({
        email: user.email,
        name: user.full_name,
        amount: plan.price,
        user_id: user.user_id,
        plan_id: subscription_plan_id,
      });
      return response_service.successResponse(
        res,
        "Subscription created successfully.",
        { clientSecret: stripeIntent }
      );
    } else if (req.body.payment_method == "paypal") {
      const paypalIntent = await createOrder(plan.price);
      if (!paypalIntent) {
        return response_service.notFoundResponse(
          res,
          "Client secret not found."
        );
      }
      return response_service.successResponse(
        res,
        "Subscription created successfully.",
        { clientSecret: paypalIntent.id }
      );
    }
    return response_service.notFoundResponse(res, "Payment method not found.");
  } catch (err: any) {
    logger.error("Error creating subscription:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// for payment confirmation after success completion ===============================================
async function afterPayment(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return response_service.notFoundResponse(res, "User not found.");
    }

    const subscription_plan_id = req.body.plan_id;
    const plan = await subscription_service.getPlanById(subscription_plan_id);
    if (!plan) {
      return response_service.notFoundResponse(res, "Plan not found.");
    }
    const payment_method = req.body.payment_method;
    // Store the PaymentIntent id (not the client secret) so reuse checks match either form.
    const payment_reference = String(req.body.payment_reference).split("_secret_")[0];

    if (await subscription_service.isPaymentReferenceUsed(payment_reference)) {
      return response_service.badRequestResponse(
        res,
        "This payment has already been used."
      );
    }

    // Never trust the client's payment_status: confirm with the provider.
    let isPaid = false;
    if (payment_method === "stripe") {
      isPaid = await subscription_service.verifyStripePayment({
        reference: payment_reference,
        user_id: user.user_id,
        plan_id: subscription_plan_id,
        amount: plan.price,
      });
    } else if (payment_method === "paypal") {
      const paid = await verifyOrderPaid(payment_reference);
      isPaid =
        !!paid &&
        paid.currency === "USD" &&
        Number(paid.amount) === Number(plan.price);
    }

    if (!isPaid) {
      return response_service.badRequestResponse(
        res,
        "Payment not completed or does not match the plan."
      );
    }

    await subscription_service.subscribe({
      user_id: user.user_id,
      plan_id: subscription_plan_id,
      amount: plan.price,
      payment_date: new Date(),
      payment_method,
      payment_status: "completed",
      payment_reference,
    });

    const subscription = await user_service.getUser(
      {
        user_id: user.user_id,
      },
      [
        {
          model: SubscribedUsers,
          as: "subscriptionPlan",
          where: {
            is_active: true,
          },
          include: [
            {
              model: SunscriptionPlans,
              as: "plan",
            },
          ],
        },
        {
          model: History,
          as: "history",
        },
      ]
    );
    return response_service.successResponse(
      res,
      "Subscription created successfully.",
      subscription
    );
  } catch (err: any) {
    logger.error("Error creating subscription:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}

// get user subscriptions ====================================================
async function getUserSubscriptions(req: Request, res: Response) {
  try {
    const subscriptions = await user_service.getUserSubscriptions(
      req.user?.user_id || req.body.user_id || null,
      req.body.page || 1,
      req.body.limit || 10
    );
    if (!subscriptions)
      return response_service.notFoundResponse(res, "User not found.");
    return response_service.successResponse(
      res,
      "User subscriptions retrieved successfully.",
      subscriptions
    );
  } catch (err: any) {
    logger.error("Error retrieving user subscriptions:", err);
    return response_service.internalServerErrorResponse(res, err.message);
  }
}
export {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  subscribe,
  afterPayment,
  getUserSubscriptions,
};
