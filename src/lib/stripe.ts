import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const STRIPE_PLANS = {
  free: { monthly: null, documentsLimit: 3 },
  pro: { monthly: "price_pro_monthly", documentsLimit: Infinity },
  business: { monthly: "price_business_monthly", documentsLimit: Infinity },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
