export type Plan = "free" | "pro" | "business";
export type Interval = "month" | "quarter" | "semiannual" | "year";
export type PaidPlan = Exclude<Plan, "free">;

export const PLANS: Plan[] = ["free", "pro", "business"];

export const INTERVALS: Interval[] = ["month", "quarter", "semiannual", "year"];

export const PRICES: Record<PaidPlan, Record<Interval, number>> = {
  pro: { month: 29, quarter: 79, semiannual: 149, year: 279 },
  business: { month: 99, quarter: 259, semiannual: 499, year: 949 },
};

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, business: 2 };

export const INTERVAL_MONTHS: Record<Interval, number> = {
  month: 1,
  quarter: 3,
  semiannual: 6,
  year: 12,
};

export function priceOf(plan: Plan, interval: Interval): number {
  if (plan === "free") return 0;
  return PRICES[plan][interval];
}

/** Percentage saved vs. paying monthly for the same period (0 for month). */
export function discountOf(plan: Plan, interval: Interval): number {
  if (plan === "free" || interval === "month") return 0;
  const monthly = PRICES[plan as PaidPlan].month;
  const value = PRICES[plan as PaidPlan][interval];
  const months = INTERVAL_MONTHS[interval];
  return Math.round((1 - value / (monthly * months)) * 100);
}

export function isUpgrade(current: Plan, target: Plan): boolean {
  return PLAN_RANK[target] > PLAN_RANK[current];
}