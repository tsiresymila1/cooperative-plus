import { adminDb } from "@cp/instant/admin";
import { HttpError } from "../errors";

export async function requireUser(authorization?: string): Promise<string> {
  const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? "");
  if (!match) throw new HttpError(401, "Authentification requise.");
  try {
    return (await adminDb.auth.verifyToken(match[1])).id;
  } catch {
    throw new HttpError(401, "Session invalide ou expirée.");
  }
}
