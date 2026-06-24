import { adminDb, id as newId } from "@cp/instant/admin";
import { hashPassword } from "@cp/instant/password";
import { HttpError } from "../errors";

export type CreateAssistantInput = {
  coopId: string;
  email: string;
  name?: string;
  password: string;
  permissions?: string[];
};

/** Create (or update) an assistant account with email+password for a cooperative. */
export async function createAssistant(input: CreateAssistantInput): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  const name = (input.name ?? "").trim();
  const permissions = input.permissions ?? [];

  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { id: input.coopId } } } });
  if (!cooperatives?.[0]) throw new HttpError(404, "Coopérative introuvable.");

  await adminDb.auth.createToken(email); // ensures the $user exists
  const { $users } = await adminDb.query({ $users: { $: { where: { email } } } });
  const user = $users?.[0];
  if (!user) throw new HttpError(500, "Impossible de créer le compte.");

  const now = Date.now();
  const chunks: any[] = [];
  if (name) chunks.push(adminDb.tx.$users[user.id].update({ name }));

  const { credentials } = await adminDb.query({ credentials: { $: { where: { email } } } });
  const credId = credentials?.[0]?.id ?? newId();
  chunks.push(adminDb.tx.credentials[credId].update({ email, passwordHash: hashPassword(input.password), createdAt: now }));

  const { memberships } = await adminDb.query({
    memberships: { $: { where: { "user.id": user.id, "cooperative.id": input.coopId } } },
  });
  const memId = memberships?.[0]?.id ?? newId();
  chunks.push(
    adminDb.tx.memberships[memId]
      .update({ role: "assistant", permissions, status: "active", createdAt: memberships?.[0]?.createdAt ?? now })
      .link({ cooperative: input.coopId, user: user.id }),
  );

  await adminDb.transact(chunks);
  return { ok: true };
}
