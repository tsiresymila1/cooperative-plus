import { adminDb } from "@cp/instant/admin";
import { createMiddleware } from "hono/factory";

import { HttpError } from "../errors";

function bearerToken(authorization: string | undefined): string {
  const [scheme, token, extra] = authorization?.trim().split(/\s+/) ?? [];
  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    throw new HttpError(401, "Authentification requise.");
  }
  return token;
}

/** Require a verified InstantDB session whose user is a platform administrator. */
export async function requirePlatformAdmin(authorization: string | undefined): Promise<void> {
  const token = bearerToken(authorization);

  let user: { id: string };
  try {
    user = await adminDb.auth.verifyToken(token);
  } catch {
    throw new HttpError(401, "Session invalide ou expirée.");
  }

  const { $users } = await adminDb.query({
    $users: { $: { where: { id: user.id } } },
  });
  if (!$users?.[0]?.isPlatformAdmin) {
    throw new HttpError(403, "Accès administrateur requis.");
  }
}

/** Protect every route mounted after this middleware with platform-admin access. */
export const platformAdminMiddleware = createMiddleware(async (c, next) => {
  await requirePlatformAdmin(c.req.header("Authorization"));
  await next();
});
