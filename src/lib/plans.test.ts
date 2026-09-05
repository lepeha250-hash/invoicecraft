import { describe, it, expect } from "vitest";
import {
  PRICES,
  PLAN_RANK,
  INTERVAL_MONTHS,
  priceOf,
  discountOf,
  isUpgrade,
} from "./plans";

describe("priceOf", () => {
  it("is free for all intervals on the free plan", () => {
    for (const interval of ["month", "quarter", "semiannual", "year"] as const) {
      expect(priceOf("free", interval)).toBe(0);
    }
  });

  it("matches static pricing tables", () => {
    expect(priceOf("pro", "month")).toBe(29);
    expect(priceOf("pro", "quarter")).toBe(79);
    expect(priceOf("pro", "semiannual")).toBe(149);
    expect(priceOf("pro", "year")).toBe(279);
    expect(priceOf("business", "month")).toBe(99);
    expect(priceOf("business", "quarter")).toBe(259);
    expect(priceOf("business", "semiannual")).toBe(499);
    expect(priceOf("business", "year")).toBe(949);
  });
});

describe("discountOf", () => {
  it("returns 0 for the free plan and monthly interval", () => {
    expect(discountOf("free", "year")).toBe(0);
    expect(discountOf("pro", "month")).toBe(0);
    expect(discountOf("business", "month")).toBe(0);
  });

  it("longer periods always cost less than the monthly equivalent", () => {
    for (const plan of ["pro", "business"] as const) {
      for (const interval of ["quarter", "semiannual", "year"] as const) {
        const months = INTERVAL_MONTHS[interval];
        const monthlyTotal = PRICES[plan].month * months;
        expect(PRICES[plan][interval]).toBeLessThan(monthlyTotal);
        expect(discountOf(plan, interval)).toBeGreaterThan(0);
      }
    }
  });

  it("yearly discounts are the largest", () => {
    for (const plan of ["pro", "business"] as const) {
      expect(discountOf(plan, "year")).toBeGreaterThan(discountOf(plan, "quarter"));
    }
  });
});

describe("PLAN_RANK / isUpgrade", () => {
  it("ranks plans in the expected order", () => {
    expect(PLAN_RANK).toEqual({ free: 0, pro: 1, business: 2 });
  });

  it("allows upgrades only to strictly higher plans", () => {
    expect(isUpgrade("free", "pro")).toBe(true);
    expect(isUpgrade("free", "business")).toBe(true);
    expect(isUpgrade("pro", "business")).toBe(true);
    expect(isUpgrade("business", "pro")).toBe(false);
    expect(isUpgrade("pro", "free")).toBe(false);
    expect(isUpgrade("business", "business")).toBe(false);
    expect(isUpgrade("pro", "pro")).toBe(false);
  });
});