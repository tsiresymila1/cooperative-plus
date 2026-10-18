import { adminDb, lookup } from "@cp/instant/admin";

const dayKey = (now: number) => new Date(now).toISOString().slice(0, 10);

/** Idempotent: one row per visitor per day, so repeat calls never double-count. */
export async function trackVisit(input: { visitorId: string; path?: string }, now = Date.now()) {
  const day = dayKey(now);
  const key = `${day}_${input.visitorId}`;
  await adminDb.transact(
    adminDb.tx.siteVisits[lookup("key", key)]!.update({
      key,
      day,
      visitorId: input.visitorId,
      path: input.path?.slice(0, 200),
      createdAt: now,
    }),
  );
  return { ok: true as const };
}
