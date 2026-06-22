/**
 * Make a user an owner of a cooperative (creates/updates a membership).
 * Run: INSTANT_APP_ID=... INSTANT_ADMIN_TOKEN=... pnpm --filter @cp/instant make-owner <email> <coopSlug>
 */
import { adminDb, id } from "./admin";

async function main() {
  const email = process.argv[2];
  const slug = process.argv[3];
  if (!email || !slug) {
    console.error("Usage: tsx src/make-owner.ts <email> <coopSlug>");
    process.exit(1);
  }

  const { $users } = await adminDb.query({ $users: { $: { where: { email } } } });
  const user = $users?.[0];
  if (!user) {
    console.error(`✗ No user found with email "${email}". They must sign up first.`);
    process.exit(1);
  }

  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { slug } } } });
  const coop = cooperatives?.[0];
  if (!coop) {
    console.error(`✗ No cooperative found with slug "${slug}".`);
    process.exit(1);
  }

  // Check for an existing membership (avoid duplicates).
  const { memberships } = await adminDb.query({
    memberships: { $: { where: { "user.id": user.id, "cooperative.id": coop.id } } },
  });
  const existing = memberships?.[0];
  const mId = existing?.id ?? id();

  await adminDb.transact(
    adminDb.tx.memberships[mId]
      .update({ role: "owner", status: "active", permissions: [], createdAt: Date.now() })
      .link({ user: user.id, cooperative: coop.id }),
  );
  console.log(`✓ ${email} is now an owner of "${coop.displayName}" (${slug}).`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
