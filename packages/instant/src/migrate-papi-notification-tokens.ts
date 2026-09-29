/**
 * One-off, idempotent migration for pending PAPI payments.
 *
 * Dry run (default):
 *   pnpm migrate:papi-tokens
 * Apply:
 *   pnpm migrate:papi-tokens -- --apply
 */
import { adminDb } from "./admin";
import {
  migratePapiTokenMeta,
  selectPapiTokenMigrations,
} from "./papi-token-migration";

const APPLY = process.argv.includes("--apply");
const BATCH_SIZE = 50;

async function loadPapiPayments() {
  const { payments } = await adminDb.query({
    payments: {
      $: { where: { provider: "papi" } },
    },
  });
  return payments ?? [];
}

async function main() {
  const payments = await loadPapiPayments();
  const migrations = selectPapiTokenMigrations(payments);
  const pendingLegacy = payments.filter(
    (payment) => payment.status === "pending" && migratePapiTokenMeta(payment.meta),
  ).length;

  console.log(
    `[papi-token-migration] total=${payments.length} legacy=${migrations.length} pendingLegacy=${pendingLegacy} mode=${APPLY ? "apply" : "dry-run"}`,
  );

  if (!APPLY) {
    console.log("[papi-token-migration] Aucun changement écrit. Relancez avec --apply.");
    return;
  }

  const operations = migrations.map(({ id, meta }) =>
    adminDb.tx.payments[id]!.update({ meta }),
  );
  for (let index = 0; index < operations.length; index += BATCH_SIZE) {
    await adminDb.transact(operations.slice(index, index + BATCH_SIZE));
  }

  const remaining = (await loadPapiPayments()).filter(
    (payment) => migratePapiTokenMeta(payment.meta) !== null,
  );
  if (remaining.length) {
    throw new Error(
      `[papi-token-migration] Échec de vérification: ${remaining.length} jeton(s) brut(s) restant(s).`,
    );
  }

  console.log(`[papi-token-migration] migrated=${migrations.length} remaining=0`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
