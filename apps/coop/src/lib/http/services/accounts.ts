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

export type UpdateAssistantInput = {
  coopId: string;
  membershipId: string;
  status?: "active" | "disabled";
  permissions?: string[];
};

export type DeleteAssistantInput = {
  coopId: string;
  membershipId: string;
};

async function findManagedAssistant(coopId: string, membershipId: string) {
  const { memberships } = await adminDb.query({
    memberships: {
      $: { where: { id: membershipId } },
      cooperative: {},
    },
  });
  const membership = memberships?.[0];
  if (!membership) throw new HttpError(404, "Membre introuvable.");
  if (membership.cooperative?.id !== coopId) {
    throw new HttpError(403, "Ce membre n'appartient pas à cette coopérative.");
  }
  if (membership.role !== "assistant") {
    throw new HttpError(403, "Le compte propriétaire ne peut pas être modifié ici.");
  }
  return membership;
}

/** Create an assistant identity, or re-attach a previously removed coop identity. */
export async function createAssistant(input: CreateAssistantInput): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  const name = (input.name ?? "").trim();
  const permissions = input.permissions ?? [];

  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { id: input.coopId } } } });
  if (!cooperatives?.[0]) throw new HttpError(404, "Coopérative introuvable.");

  // Never convert or overwrite a customer, incomplete identity, or platform admin.
  const { $users: existingUsers, credentials: existingCredentials } = await adminDb.query({
    $users: { $: { where: { email } } },
    credentials: { $: { where: { email } } },
  });
  const existingUser = existingUsers?.[0];
  const existingCredential = existingCredentials?.[0];

  if (existingUser?.isPlatformAdmin || Boolean(existingUser) !== Boolean(existingCredential)) {
    throw new HttpError(409, "Un compte existe déjà avec cet email.");
  }

  if (existingUser && existingCredential) {
    const { memberships } = await adminDb.query({
      memberships: {
        $: {
          where: {
            "user.id": existingUser.id,
            "cooperative.id": input.coopId,
          },
        },
      },
    });
    if (memberships?.length) {
      throw new HttpError(409, "Ce compte appartient déjà à cette coopérative.");
    }

    const memId = newId();
    await adminDb.transact(
      adminDb.tx.memberships[memId]
        .update({ role: "assistant", permissions, status: "active", createdAt: Date.now() })
        .link({ cooperative: input.coopId, user: existingUser.id }),
    );
    return { ok: true };
  }

  await adminDb.auth.createToken(email); // ensures the $user exists
  const { $users } = await adminDb.query({ $users: { $: { where: { email } } } });
  const user = $users?.[0];
  if (!user) throw new HttpError(500, "Impossible de créer le compte.");

  const now = Date.now();
  const chunks: any[] = [];
  if (name) chunks.push(adminDb.tx.$users[user.id].update({ name }));

  const credId = newId();
  chunks.push(adminDb.tx.credentials[credId].update({ email, passwordHash: hashPassword(input.password), createdAt: now }));

  const memId = newId();
  chunks.push(
    adminDb.tx.memberships[memId]
      .update({ role: "assistant", permissions, status: "active", createdAt: now })
      .link({ cooperative: input.coopId, user: user.id }),
  );

  await adminDb.transact(chunks);
  return { ok: true };
}

/** Update only mutable fields of an assistant membership owned by the cooperative. */
export async function updateAssistant(input: UpdateAssistantInput): Promise<{ ok: true }> {
  await findManagedAssistant(input.coopId, input.membershipId);
  const update = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.permissions ? { permissions: input.permissions } : {}),
  };
  await adminDb.transact(adminDb.tx.memberships[input.membershipId].update(update));
  return { ok: true };
}

/** Remove an assistant membership without permitting owner-account deletion. */
export async function deleteAssistant(input: DeleteAssistantInput): Promise<{ ok: true }> {
  await findManagedAssistant(input.coopId, input.membershipId);
  await adminDb.transact(adminDb.tx.memberships[input.membershipId].delete());
  return { ok: true };
}
