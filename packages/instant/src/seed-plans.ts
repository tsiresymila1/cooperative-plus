// Idempotent upsert of the canonical subscription plans into the live DB.
// Safe to re-run: each plan has a stable id, so update() upserts in place.
//   pnpm --filter @cp/instant seed-plans
import { adminDb } from "./admin";
import { PLAN_DEFS } from "./subscription";

async function main() {
  await adminDb.transact(
    PLAN_DEFS.map((p) =>
      adminDb.tx.plans[p.id]!.update({
        code: p.code,
        name: p.name,
        priceAmount: p.priceAmount,
        currency: "MGA",
        interval: p.interval,
        maxVehicles: p.maxVehicles,
        maxRoutes: p.maxRoutes,
        maxAssistants: p.maxAssistants,
        maxTripsMonth: p.maxTripsMonth,
        transactionFeeBps: p.transactionFeeBps,
        isActive: true,
      }),
    ),
  );
  console.log(`upserted ${PLAN_DEFS.length} plans:`, PLAN_DEFS.map((p) => p.code).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
