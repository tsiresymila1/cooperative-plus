/**
 * Create/grant access accounts.
 *   tsx src/grant.ts <email> admin                 → platform admin
 *   tsx src/grant.ts <email> owner <coopSlug>      → cooperative owner
 *   tsx src/grant.ts <email> assistant <coopSlug>  → cooperative assistant
 * Creates the InstantDB user if it doesn't exist yet (admin SDK), then grants.
 * Sign in afterwards with that email (magic code) on the matching app.
 */
import { adminDb, id } from "./admin";

const [email, role, coopSlug] = process.argv.slice(2);
if (!email || !role) {
  console.error("usage: grant <email> <admin|owner|assistant> [coopSlug]");
  process.exit(1);
}

const ASSISTANT_PERMS = [
  "booking.create", "booking.update", "booking.cancel", "booking.checkin",
  "payment.cash.collect", "payment.proof.upload", "trip.view", "report.view",
];

async function findUser() {
  const r = await adminDb.query({ $users: { $: { where: { email } } } });
  return r.$users[0];
}

async function main() {
  // ensure the user exists (createToken provisions a $user if absent)
  let user = await findUser();
  if (!user) {
    await adminDb.auth.createToken(email);
    user = await findUser();
  }
  if (!user) throw new Error("could not create/find user " + email);

  if (role === "admin") {
    await adminDb.transact(adminDb.tx.$users[user.id].update({ isPlatformAdmin: true }));
    console.log(`✓ ${email} is now PLATFORM ADMIN`);
  } else if (role === "owner" || role === "assistant") {
    if (!coopSlug) throw new Error("coopSlug required for owner/assistant");
    const c = await adminDb.query({ cooperatives: { $: { where: { slug: coopSlug } } } });
    const coop = c.cooperatives[0];
    if (!coop) throw new Error("cooperative not found: " + coopSlug);
    const m = await adminDb.query({ memberships: { $: { where: { "user.id": user.id, "cooperative.id": coop.id } } } });
    const mid = m.memberships[0]?.id ?? id();
    await adminDb.transact(
      adminDb.tx.memberships[mid].update({
        role, status: "active", permissions: role === "assistant" ? ASSISTANT_PERMS : [], createdAt: Date.now(),
      }).link({ user: user.id, cooperative: coop.id }),
    );
    console.log(`✓ ${email} is now ${role.toUpperCase()} of ${coop.displayName} (${coopSlug})`);
  } else {
    throw new Error("role must be admin|owner|assistant");
  }

  console.log(`  user id: ${user.id}`);
  console.log(`  → sign in at the matching app with ${email} (magic code).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error("✗", e.message ?? e); process.exit(1); });
