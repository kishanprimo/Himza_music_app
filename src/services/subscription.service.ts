import { ISubscriptionPlans, IUser } from "../types";
import db from "../models";

const { SunscriptionPlans, User, SubscribedUsers } = db;
import Stripe from "stripe";
import { Op } from "sequelize";
import { config } from "../config";

async function getAllPlans(): Promise<any> {
  try {
    const plans = await SunscriptionPlans.findAll({
      where: {
        is_deleted: false,
      },
    });
    return plans;
  } catch (err) {
    throw err;
  }
}

async function getPlanById(
  planId: number
): Promise<ISubscriptionPlans | undefined> {
  try {
    const plan = await SunscriptionPlans.findOne({
      where: { plan_id: planId },
    });
    return plan?.toJSON();
  } catch (err) {
    throw err;
  }
}

async function createPlan(payload: any): Promise<ISubscriptionPlans> {
  try {
    const plan = await SunscriptionPlans.create(payload);
    return plan.toJSON();
  } catch (err) {
    throw err;
  }
}

async function updatePlan(
  payload: any,
  where: any
): Promise<ISubscriptionPlans | null> {
  try {
    const plan = await SunscriptionPlans.update(payload, {
      where: where,
      returning: true,
    });
    if (plan[1].length <= 0) return null;
    return plan[1][0].toJSON();
  } catch (err) {
    throw err;
  }
}

async function deletePlan(where: any): Promise<ISubscriptionPlans | null> {
  try {
    const plan = await SunscriptionPlans.update(
      { is_deleted: true },
      { where: where, returning: true }
    );
    if (plan[1].length <= 0) return null;
    return plan[1][0].toJSON();
  } catch (err) {
    throw err;
  }
}

/**
 * Creates a Stripe Payment Intent with static shipping
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {string} params.name - Customer full name
 * @param {number} params.amount - Amount in USD
 * @returns {Promise<string>} clientSecret
 */
export async function createStripeIntent({ email, name, amount }: any) {
  if (!email || !name) throw new Error("Email and Name are required");
  if (!amount || amount <= 0)
    throw new Error("Amount must be greater than zero");

  const stripe = new Stripe(config.STRIPE_SECRET_KEY as string);
  // 1. Create customer
  const customer = await stripe.customers.create({
    email,
    name,
  });

  // 2. Create payment intent with static shipping
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert dollars to cents
    currency: "usd",
    customer: customer.id,
    receipt_email: email,
    description: "Reel Boost Purchase",
    automatic_payment_methods: { enabled: true },
    shipping: {
      name,
      address: {
        line1: "510 Townsend St",
        city: "San Francisco",
        state: "CA",
        postal_code: "98140",
        country: "US",
      },
    },
  });

  // 3. Return client secret
  return paymentIntent.client_secret;
}

async function subscribe({
  user_id,
  plan_id,
  amount,
  payment_date,
  payment_method,
  payment_status,
}: any) {
  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      throw new Error("User not found");
    }
    const plan: any = await SunscriptionPlans.findByPk(plan_id);
    if (!plan) {
      throw new Error("Plan not found");
    }
    await SubscribedUsers.create({
      user_id,
      plan_id,
      amount,
      payment_date,
      payment_method,
      payment_status,
      expires_at: new Date(
        Date.now() +
          (plan.duration === "1 MONTH"
            ? 30
            : plan.duration === "6 MONTHS"
            ? 180
            : 365) *
            24 *
            60 *
            60 *
            1000
      ),
    });
  } catch (err) {
    throw err;
  }
}

async function removeExpieredSubscriptions() {
  try {
    const users = await User.findAll({
      where: {
        subscription_plan_expires: {
          [Op.lt]: new Date(),
        },
      },
    });
    for (const user of users) {
      await user.update({
        subscription_plan_id: null,
        subscription_plan_expires: null,
      });
    }
  } catch (err) {
    throw err;
  }
}

async function getAllSubscriptionHistory(
  user_id?: number,
  page: number = 0,
  limit: number = 0
) {
  try {
    const subscriptions = await SubscribedUsers.findAll({
      ...(user_id && {
        where: {
          user_id: user_id,
        },
      }),
      limit,
      offset: (page - 1) * limit,
    });
    return {
      subscriptions,
      Pagination: {
        current_page: page,
        records_per_page: limit,
        total_pages: Math.ceil(subscriptions.length / limit),
        total_records: subscriptions.length,
      },
    };
  } catch (err) {
    throw err;
  }
}

export default {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  createStripeIntent,
  subscribe,
  removeExpieredSubscriptions,
  getAllSubscriptionHistory,
};
