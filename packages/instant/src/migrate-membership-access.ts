import { adminDb } from "./admin";

async function main() {
  const { memberships } = await adminDb.query({ memberships: { cooperative: {} } });
  const operations = memberships.map(m => {
    if (!m.cooperative?.id) throw new Error(`Membership ${m.id} has no cooperative`);
    return adminDb.tx.memberships[m.id]!.update({ access: {
      cooperativeId: m.cooperative.id, role: m.role, status: m.status, permissions: m.permissions,
    } });
  });
  console.log(`${operations.length} memberships; ${process.argv.includes("--apply") ? "apply" : "dry-run"}`);
  if (!process.argv.includes("--apply")) return;
  for (let i = 0; i < operations.length; i += 50) await adminDb.transact(operations.slice(i, i + 50));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
