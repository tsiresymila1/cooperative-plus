import { adminDb } from "@cp/instant/admin";
import { verifyPassword } from "@cp/instant/password";
import { HttpError } from "../errors";

/** Verify email+password against `credentials`, mint an InstantDB token. */
export async function passwordSignIn(email: string, password: string): Promise<{ token: string }> {
  const e = email.trim().toLowerCase();
  const r = await adminDb.query({ credentials: { $: { where: { email: e } } } });
  const cred = (r.credentials ?? [])[0] as { passwordHash?: string } | undefined;
  if (!cred?.passwordHash || !verifyPassword(password, cred.passwordHash)) {
    throw new HttpError(401, "Identifiants invalides.");
  }
  const token = await adminDb.auth.createToken(e);
  return { token };
}
