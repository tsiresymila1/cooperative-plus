import { describe, expect, it } from "vitest";

import {
  atLimit,
  DAY_MS,
  dueStatus,
  GRACE_DAYS,
  nextPeriodEnd,
  PLAN_DEFS,
  subSuspended,
  SUB_STATUS,
  subUsable,
  TRIAL_DAYS,
  TRIAL_PLAN,
} from "./subscription";

const NOW = new Date(2026, 4, 15, 12).getTime();

describe("subscription catalogue", () => {
  it("exposes a stable free trial followed by paid plans", () => {
    expect(TRIAL_DAYS).toBe(14);
    expect(TRIAL_PLAN).toBe(PLAN_DEFS[0]);
    expect(TRIAL_PLAN).toMatchObject({ code: "essai", priceAmount: 0, interval: "month" });
    expect(PLAN_DEFS.map(({ code }) => code)).toEqual(["essai", "growth", "pro"]);
    expect(new Set(PLAN_DEFS.map(({ id }) => id))).toHaveProperty("size", PLAN_DEFS.length);
    expect(SUB_STATUS).toEqual(["trialing", "active", "past_due", "suspended", "cancelled"]);
  });
});

describe("subscription access", () => {
  it.each(["trialing", "active", "past_due"])("keeps %s subscriptions usable", (status) => {
    expect(subUsable(status)).toBe(true);
    expect(subSuspended(status)).toBe(false);
  });

  it.each(["suspended", "cancelled"])("hard-locks %s subscriptions", (status) => {
    expect(subUsable(status)).toBe(false);
    expect(subSuspended(status)).toBe(true);
  });

  it.each([undefined, null, "unknown"])("does not grant access for %s", (status) => {
    expect(subUsable(status)).toBe(false);
    expect(subSuspended(status)).toBe(false);
  });
});

describe("plan quotas", () => {
  it("reports a quota exactly at and above its positive cap", () => {
    expect(atLimit(3, 2)).toBe(false);
    expect(atLimit(3, 3)).toBe(true);
    expect(atLimit(3, 4)).toBe(true);
  });

  it.each([undefined, 0, -1])("treats max %s as unlimited", (max) => {
    expect(atLimit(max, 10_000)).toBe(false);
  });
});

describe("billing periods", () => {
  it("starts a monthly period from now when no current period exists", () => {
    const expected = new Date(NOW);
    expected.setMonth(expected.getMonth() + 1);

    expect(nextPeriodEnd(null, NOW)).toBe(expected.getTime());
    expect(nextPeriodEnd(undefined, NOW)).toBe(expected.getTime());
  });

  it("extends a future period instead of shortening it", () => {
    const currentEnd = NOW + 10 * DAY_MS;
    const expected = new Date(currentEnd);
    expected.setMonth(expected.getMonth() + 1);

    expect(nextPeriodEnd(currentEnd, NOW)).toBe(expected.getTime());
  });

  it("restarts expired periods from now and supports yearly intervals", () => {
    const monthly = new Date(NOW);
    monthly.setMonth(monthly.getMonth() + 1);
    const yearly = new Date(NOW);
    yearly.setFullYear(yearly.getFullYear() + 1);

    expect(nextPeriodEnd(NOW - DAY_MS, NOW)).toBe(monthly.getTime());
    expect(nextPeriodEnd(NOW, NOW)).toBe(monthly.getTime());
    expect(nextPeriodEnd(null, NOW, "year")).toBe(yearly.getTime());
  });
});

describe("subscription lifecycle", () => {
  it("moves an expired trial to past due only after its exact deadline", () => {
    expect(dueStatus({ status: "trialing", trialEndsAt: NOW + 1 }, NOW)).toBeNull();
    expect(dueStatus({ status: "trialing", trialEndsAt: NOW }, NOW)).toBeNull();
    expect(dueStatus({ status: "trialing", trialEndsAt: NOW - 1 }, NOW)).toBe("past_due");
    expect(dueStatus({ status: "trialing", trialEndsAt: null }, NOW)).toBeNull();
  });

  it("keeps a current active period unchanged and restores renewed past-due periods", () => {
    expect(dueStatus({ status: "active", currentPeriodEnd: NOW }, NOW)).toBeNull();
    expect(dueStatus({ status: "active", currentPeriodEnd: NOW + DAY_MS }, NOW)).toBeNull();
    expect(dueStatus({ status: "past_due", currentPeriodEnd: NOW + DAY_MS }, NOW)).toBe("active");
  });

  it("moves an expired period through grace and suspension boundaries", () => {
    const expiredAt = NOW - DAY_MS;
    const exactGraceBoundary = NOW - GRACE_DAYS * DAY_MS;

    expect(dueStatus({ status: "active", currentPeriodEnd: expiredAt }, NOW)).toBe("past_due");
    expect(dueStatus({ status: "past_due", currentPeriodEnd: expiredAt }, NOW)).toBeNull();
    expect(dueStatus({ status: "active", currentPeriodEnd: exactGraceBoundary }, NOW)).toBe("past_due");
    expect(dueStatus({ status: "active", currentPeriodEnd: exactGraceBoundary - 1 }, NOW)).toBe("suspended");
    expect(dueStatus({ status: "past_due", currentPeriodEnd: exactGraceBoundary - 1 }, NOW)).toBe("suspended");
  });

  it("does not transition terminal states or subscriptions without a period", () => {
    expect(dueStatus({ status: "cancelled", currentPeriodEnd: NOW - DAY_MS }, NOW)).toBeNull();
    expect(dueStatus({ status: "suspended", currentPeriodEnd: NOW - DAY_MS }, NOW)).toBeNull();
    expect(dueStatus({ status: "active", currentPeriodEnd: null }, NOW)).toBeNull();
    expect(dueStatus({}, NOW)).toBeNull();
  });
});
