/**
 * Grant platform-admin to a user by email.
 * Run: INSTANT_APP_ID=... INSTANT_ADMIN_TOKEN=... pnpm --filter @cp/instant make-admin <email>
 */
import { adminDb } from "./admin";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx src/make-admin.ts <email>");
    process.exit(1);
  }

  const { $users } = await adminDb.query({ $users: { $: { where: { email } } } });
  const user = $users?.[0];
  if (!user) {
    console.error(`✗ No user found with email "${email}". They must sign up first.`);
    process.exit(1);
  }

  await adminDb.transact(adminDb.tx.$users[user.id].update({ isPlatformAdmin: true }));
  console.log(`✓ ${email} is now a platform admin.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
