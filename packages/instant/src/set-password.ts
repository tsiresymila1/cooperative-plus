/**
 * Set (or reset) an email+password login for coop/admin custom auth.
 *   tsx src/set-password.ts <email> <password>
 * Creates the InstantDB user if absent + upserts a `credentials` row.
 */
import { adminDb, id } from "./admin";
import { hashPassword } from "./password";

const [emailArg, password] = process.argv.slice(2);
if (!emailArg || !password) {
  console.error("usage: set-password <email> <password>");
  process.exit(1);
}
const email = emailArg.toLowerCase();

async function main() {
  await adminDb.auth.createToken(email); // ensures the $user exists
  const r = await adminDb.query({ credentials: { $: { where: { email } } } });
  const cid = (r.credentials ?? [])[0]?.id ?? id();
  await adminDb.transact(adminDb.tx.credentials[cid].update({ email, passwordHash: hashPassword(password), createdAt: Date.now() }));
  console.log(`✓ mot de passe défini pour ${email}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error("✗", e?.message ?? e); process.exit(1); });
