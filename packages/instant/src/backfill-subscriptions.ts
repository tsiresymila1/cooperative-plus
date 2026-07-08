// One-off: give every cooperative that has no subscription row one, so plan
// limits and the Abonnement page work for pre-existing coops. Idempotent —
// skips coops that already have a subscription.
//   pnpm --filter @cp/instant exec tsx src/backfill-subscriptions.ts
import { adminDb, id } from "./admin";
import { TRIAL_PLAN, DAY_MS, TRIAL_DAYS } from "./subscription";

async function main() {
  const { cooperatives } = await adminDb.query({
    cooperatives: { $: {}, subscriptions: {} },
  });
  const now = Date.now();
  const chunks: any[] = [];
  let created = 0;

  for (const c of cooperatives ?? []) {
    if (((c as any).subscriptions ?? []).length) continue; // already has one
    const st = (c as any).subscriptionStatus as string | undefined;
    // Map the coop mirror status onto a subscription. Default: 14-day trial.
    const status = st === "suspended" ? "suspended" : st === "active" ? "active" : "trialing";
    const trialEndsAt = now + TRIAL_DAYS * DAY_MS;
    const periodEnd = status === "active" ? now + 30 * DAY_MS : trialEndsAt;
    chunks.push(
      adminDb.tx.subscriptions[id()]!
        .update({
          status,
          trialEndsAt: status === "trialing" ? trialEndsAt : undefined,
          currentPeriodEnd: periodEnd,
          createdAt: now,
        })
        .link({ cooperative: c.id, plan: TRIAL_PLAN.id }),
    );
    created++;
  }

  if (chunks.length) await adminDb.transact(chunks);
  console.log(`backfilled ${created} subscriptions (of ${cooperatives?.length ?? 0} coops)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
