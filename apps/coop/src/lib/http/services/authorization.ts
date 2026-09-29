import { adminDb } from "@cp/instant/admin";
import { createMiddleware } from "hono/factory";

import { HttpError } from "../errors";

type CoopAccessRule =
  | { permission: "team" | "settings"; ownerOnly?: never }
  | { ownerOnly: true; permission?: never };

function bearerToken(authorization: string | undefined): string {
  const [scheme, token, extra] = authorization?.trim().split(/\s+/) ?? [];
  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    throw new HttpError(401, "Authentification requise.");
  }
  return token;
}

/**
 * Authorize a cooperative mutation against the cooperative id in its validated
 * payload. Platform admins bypass membership rules; everyone else needs an
 * active membership with the requested role or permission.
 */
export async function requireCoopAccess(
  authorization: string | undefined,
  coopId: string,
  rule: CoopAccessRule,
): Promise<void> {
  const token = bearerToken(authorization);

  let user: { id: string };
  try {
    user = await adminDb.auth.verifyToken(token);
  } catch {
    throw new HttpError(401, "Session invalide ou expirée.");
  }

  await requireUserCoopAccess(user.id, coopId, rule);
}

async function requireUserCoopAccess(
  userId: string,
  coopId: string,
  rule: CoopAccessRule,
): Promise<void> {
  const { $users, memberships } = await adminDb.query({
    $users: { $: { where: { id: userId } } },
    memberships: {
      $: { where: { "user.id": userId, "cooperative.id": coopId } },
    },
  });

  if ($users?.[0]?.isPlatformAdmin) return;

  const membership = (memberships ?? []).find((candidate) => candidate.status === "active");
  if (!membership) throw new HttpError(403, "Accès à cette coopérative refusé.");

  if ("ownerOnly" in rule && rule.ownerOnly && membership.role !== "owner") {
    throw new HttpError(403, "Accès propriétaire requis.");
  }

  if (
    "permission" in rule &&
    rule.permission &&
    membership.role !== "owner" &&
    !(
      membership.role === "assistant" &&
      ((membership.permissions as string[] | undefined) ?? []).includes(rule.permission)
    )
  ) {
    throw new HttpError(403, "Permission insuffisante.");
  }
}

/**
 * Authenticate first, then authorize against the cooperative id in the JSON
 * payload. Validation remains the controller's responsibility.
 */
export const coopAccessMiddleware = (rule: CoopAccessRule) =>
  createMiddleware(async (c, next) => {
    const authorization = c.req.header("Authorization");
    const token = bearerToken(authorization);
    let user: { id: string };
    try {
      user = await adminDb.auth.verifyToken(token);
    } catch {
      throw new HttpError(401, "Session invalide ou expirée.");
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return next();
    }

    const coopId =
      body && typeof body === "object" && "coopId" in body
        ? (body as { coopId?: unknown }).coopId
        : undefined;

    if (typeof coopId !== "string" || !coopId) {
      return next();
    }

    await requireUserCoopAccess(user.id, coopId, rule);
    await next();
  });
