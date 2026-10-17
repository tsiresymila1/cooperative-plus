import { adminDb } from "@cp/instant/admin";
import { HttpError } from "../errors";

/** Delete a user: login credentials + memberships, then the $users row itself.
 *  Falls back to revoking platform-admin if the system entity refuses deletion. */
export async function deleteUser(userId: string): Promise<{ ok: true; removed: boolean }> {
  const { $users } = await adminDb.query({ $users: { $: { where: { id: userId } } } });
  const user = $users?.[0] as { id: string; email: string; isPlatformAdmin?: boolean } | undefined;
  if (!user) throw new HttpError(404, "Utilisateur introuvable.");

  const [{ credentials }, { memberships }] = await Promise.all([
    adminDb.query({ credentials: { $: { where: { email: user.email } } } }),
    adminDb.query({ memberships: { $: { where: { "user.id": user.id } } } }),
  ]);
  const chunks = [
    ...(credentials ?? []).map((c) => adminDb.tx.credentials[c.id].delete()),
    ...(memberships ?? []).map((m) => adminDb.tx.memberships[m.id].delete()),
  ];
  if (chunks.length) await adminDb.transact(chunks);

  try {
    await adminDb.transact(adminDb.tx.$users[user.id].delete());
    return { ok: true, removed: true };
  } catch {
    if (user.isPlatformAdmin) await adminDb.transact(adminDb.tx.$users[user.id].update({ isPlatformAdmin: false }));
    return { ok: true, removed: false };
  }
}
