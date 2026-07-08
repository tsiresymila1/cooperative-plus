// Cooperative subscription — pure constants + helpers (no React, no db).
// Revenue model: flat monthly fee per plan. Collection: semi-auto PAPI
// one-shot + manual admin. Lifecycle: trialing → active → past_due → suspended.

export const DAY_MS = 86_400_000;
export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 5; // active period expired → past_due for this many days before suspend

export type PlanDef = {
  id: string;
  code: string;
  name: string;
  priceAmount: number; // minor units (MGA integer)
  interval: "month";
  maxVehicles: number;
  maxRoutes: number;
  maxAssistants: number;
  maxTripsMonth: number;
  transactionFeeBps: number; // reserved (commission) — unused for now
};

// Stable ids so seeding is idempotent (upsert by id).
export const PLAN_DEFS: PlanDef[] = [
  { id: "0b000000-0000-4000-8000-000000000001", code: "essai", name: "Essai", priceAmount: 0, interval: "month", maxVehicles: 3, maxRoutes: 3, maxAssistants: 1, maxTripsMonth: 60, transactionFeeBps: 0 },
  { id: "0b000000-0000-4000-8000-000000000002", code: "growth", name: "Growth", priceAmount: 120000, interval: "month", maxVehicles: 8, maxRoutes: 15, maxAssistants: 5, maxTripsMonth: 1500, transactionFeeBps: 200 },
  { id: "0b000000-0000-4000-8000-000000000003", code: "pro", name: "Pro", priceAmount: 280000, interval: "month", maxVehicles: 25, maxRoutes: 999, maxAssistants: 15, maxTripsMonth: 10000, transactionFeeBps: 100 },
];
export const TRIAL_PLAN = PLAN_DEFS[0]!;

export const SUB_STATUS = ["trialing", "active", "past_due", "suspended", "cancelled"] as const;
export type SubStatus = (typeof SUB_STATUS)[number];

/** Can the coop operate (create/book)? Trials and active subs can. */
export function subUsable(status?: string | null): boolean {
  return status === "trialing" || status === "active" || status === "past_due";
}

/** Hard lockout — CoopGuard blocks the whole dashboard. */
export function subSuspended(status?: string | null): boolean {
  return status === "suspended" || status === "cancelled";
}

/** A quota is hit when the plan caps it (>0) and usage reached the cap. */
export function atLimit(max: number | undefined, count: number): boolean {
  return typeof max === "number" && max > 0 && count >= max;
}

/** Add one billing interval to a period end (or from `now` if none/past). */
export function nextPeriodEnd(currentEnd: number | null | undefined, now: number, interval: string = "month"): number {
  const base = currentEnd && currentEnd > now ? new Date(currentEnd) : new Date(now);
  if (interval === "year") base.setFullYear(base.getFullYear() + 1);
  else base.setMonth(base.getMonth() + 1);
  return base.getTime();
}

/** Derive the status a subscription SHOULD have given the clock (for the cron). */
export function dueStatus(
  sub: { status?: string | null; trialEndsAt?: number | null; currentPeriodEnd?: number | null },
  now: number,
): SubStatus | null {
  if (sub.status === "cancelled" || sub.status === "suspended") return null;
  if (sub.status === "trialing") {
    if (sub.trialEndsAt && now > sub.trialEndsAt) return "past_due";
    return null;
  }
  // active / past_due keyed on currentPeriodEnd
  const end = sub.currentPeriodEnd ?? null;
  if (!end) return null;
  if (now <= end) return sub.status === "active" ? null : "active";
  // expired
  if (now > end + GRACE_DAYS * DAY_MS) return "suspended";
  return sub.status === "past_due" ? null : "past_due";
}
