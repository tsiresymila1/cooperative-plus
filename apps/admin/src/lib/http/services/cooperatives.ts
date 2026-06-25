import { adminDb, id } from "@cp/instant/admin";
import { hashPassword } from "@cp/instant/password";
import { HttpError } from "../errors";

export type CreateCoopInput = {
  slug: string; displayName: string; legalName: string;
  region?: string; planId?: string;
  phone?: string; email?: string; address?: string;
  ownerEmail?: string; ownerName?: string; ownerPassword?: string;
};

/** Create a cooperative (+ optional subscription + owner account). */
export async function createCooperative(input: CreateCoopInput): Promise<{ ok: true; coopId: string }> {
  const slug = input.slug.trim().toLowerCase();
  const ownerEmail = (input.ownerEmail ?? "").trim().toLowerCase();
  const ownerPassword = input.ownerPassword ?? "";

  if (ownerEmail && ownerPassword.length < 6) throw new HttpError(400, "Le mot de passe doit faire au moins 6 caractères.");

  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { slug } } } });
  if (cooperatives?.[0]) throw new HttpError(409, `Le slug "${slug}" est déjà utilisé.`);

  const now = Date.now();
  const coopId = id();
  const chunks: any[] = [
    adminDb.tx.cooperatives[coopId].update({
      slug, displayName: input.displayName.trim(), legalName: input.legalName.trim(),
      region: input.region?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim().toLowerCase() || undefined,
      address: input.address?.trim() || undefined,
      currency: "MGA", timezone: "Indian/Antananarivo",
      subscriptionStatus: "active", cutoffHours: 2, refundPct: 50, createdAt: now,
    }),
  ];

  if (input.planId) {
    chunks.push(adminDb.tx.subscriptions[id()].update({ status: "active", createdAt: now }).link({ cooperative: coopId, plan: input.planId }));
  }

  if (ownerEmail) {
    await adminDb.auth.createToken(ownerEmail);
    const { $users } = await adminDb.query({ $users: { $: { where: { email: ownerEmail } } } });
    const user = $users?.[0];
    if (!user) throw new HttpError(500, "Impossible de créer le compte propriétaire.");
    if (input.ownerName) chunks.push(adminDb.tx.$users[user.id].update({ name: input.ownerName.trim() }));
    const { credentials } = await adminDb.query({ credentials: { $: { where: { email: ownerEmail } } } });
    const credId = credentials?.[0]?.id ?? id();
    chunks.push(adminDb.tx.credentials[credId].update({ email: ownerEmail, passwordHash: hashPassword(ownerPassword), createdAt: now }));
    chunks.push(adminDb.tx.memberships[id()].update({ role: "owner", permissions: [], status: "active", createdAt: now }).link({ cooperative: coopId, user: user.id }));
  }

  await adminDb.transact(chunks);
  return { ok: true, coopId };
}

// Operational (activity) namespaces — what clients/coops generate at runtime.
const OPERATIONAL = ["tickets", "payments", "refunds", "bookings", "holds", "tripInstances", "tripTemplates"] as const;
// Config the coop set up (deleted only on full delete, kept on purge).
const CONFIG = ["seatMaps", "vehicles", "routes", "destinations", "tags"] as const;

async function commitBatched(chunks: any[]) {
  for (let i = 0; i < chunks.length; i += 100) {
    await adminDb.transact(chunks.slice(i, i + 100));
  }
}

const COOP_GRAPH = {
  tripInstances: {}, tripTemplates: {}, bookings: {}, tickets: {}, payments: {}, refunds: {}, holds: {},
  routes: {}, vehicles: {}, seatMaps: {}, destinations: {}, tags: {}, subscriptions: {}, requests: {},
  members: { user: {} },
} as const;

/** Reset a cooperative to "freshly created" — wipe all trips, bookings, payments,
 *  tickets, holds, refunds, templates. Keeps the coop, owner/assistants and config. */
export async function purgeCooperative(coopId: string): Promise<{ ok: true; deleted: number }> {
  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { id: coopId } }, ...COOP_GRAPH } });
  const coop: any = cooperatives?.[0];
  if (!coop) throw new HttpError(404, "Coopérative introuvable.");

  const chunks: any[] = [];
  for (const ns of OPERATIONAL) {
    for (const it of (coop[ns] ?? [])) chunks.push((adminDb.tx as any)[ns][it.id].delete());
  }
  await commitBatched(chunks);
  return { ok: true, deleted: chunks.length };
}

/** Permanently delete a cooperative: operational data + config + memberships +
 *  member credentials (owner & assistants) + subscriptions + requests + the coop.
 *  ($users are system entities and cannot be deleted — access is revoked instead.) */
export async function deleteCooperative(coopId: string): Promise<{ ok: true; deleted: number }> {
  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { id: coopId } }, ...COOP_GRAPH } });
  const coop: any = cooperatives?.[0];
  if (!coop) throw new HttpError(404, "Coopérative introuvable.");

  const chunks: any[] = [];
  for (const ns of [...OPERATIONAL, ...CONFIG, "subscriptions", "requests"] as const) {
    for (const it of (coop[ns] ?? [])) chunks.push((adminDb.tx as any)[ns][it.id].delete());
  }
  // Memberships + their login credentials (revoke owner & assistant access).
  const emails = new Set<string>();
  for (const m of (coop.members ?? [])) {
    chunks.push(adminDb.tx.memberships[m.id].delete());
    if (m.user?.email) emails.add(String(m.user.email).toLowerCase());
  }
  if (emails.size) {
    const { credentials } = await adminDb.query({ credentials: { $: { where: { email: { $in: [...emails] } } } } });
    for (const c of (credentials ?? [])) chunks.push(adminDb.tx.credentials[c.id].delete());
  }
  chunks.push(adminDb.tx.cooperatives[coopId].delete());

  await commitBatched(chunks);
  return { ok: true, deleted: chunks.length };
}

export type CreateCoopAccountInput = {
  coopId: string; email: string; name?: string; password: string; role?: "owner" | "assistant";
};

/** Attach an account (owner|assistant) with a password to a cooperative. */
export async function createCoopAccount(input: CreateCoopAccountInput): Promise<{ ok: true }> {
  const email = input.email.trim().toLowerCase();
  const role = input.role === "assistant" ? "assistant" : "owner";

  const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { id: input.coopId } } } });
  if (!cooperatives?.[0]) throw new HttpError(404, "Coopérative introuvable.");

  await adminDb.auth.createToken(email);
  const { $users } = await adminDb.query({ $users: { $: { where: { email } } } });
  const user = $users?.[0];
  if (!user) throw new HttpError(500, "Impossible de créer le compte.");

  const now = Date.now();
  const chunks: any[] = [];
  if (input.name?.trim()) chunks.push(adminDb.tx.$users[user.id].update({ name: input.name.trim() }));
  const { credentials } = await adminDb.query({ credentials: { $: { where: { email } } } });
  const credId = credentials?.[0]?.id ?? id();
  chunks.push(adminDb.tx.credentials[credId].update({ email, passwordHash: hashPassword(input.password), createdAt: now }));
  const { memberships } = await adminDb.query({ memberships: { $: { where: { "user.id": user.id, "cooperative.id": input.coopId } } } });
  const memId = memberships?.[0]?.id ?? id();
  chunks.push(adminDb.tx.memberships[memId].update({ role, permissions: [], status: "active", createdAt: memberships?.[0]?.createdAt ?? now }).link({ cooperative: input.coopId, user: user.id }));

  await adminDb.transact(chunks);
  return { ok: true };
}
