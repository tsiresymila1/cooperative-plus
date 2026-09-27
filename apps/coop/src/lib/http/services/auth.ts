import { adminDb } from "@cp/instant/admin";
import { hashPassword, verifyPassword } from "@cp/instant/password";
import { HttpError } from "../errors";

type Credential = {
  id: string;
  passwordHash?: string;
};

async function findCredential(email: string): Promise<Credential | undefined> {
  const result = await adminDb.query({ credentials: { $: { where: { email } } } });
  return (result.credentials ?? [])[0] as Credential | undefined;
}

/** Verify email+password against `credentials`, mint an InstantDB token. */
export async function passwordSignIn(email: string, password: string): Promise<{ token: string }> {
  const e = email.trim().toLowerCase();
  const cred = await findCredential(e);
  if (!cred?.passwordHash || !verifyPassword(password, cred.passwordHash)) {
    throw new HttpError(401, "Identifiants invalides.");
  }
  const token = await adminDb.auth.createToken(e);
  return { token };
}

/**
 * Send a one-time code only for password-enabled accounts.
 * The response is deliberately identical when the email is unknown.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: true }> {
  const e = email.trim().toLowerCase();
  const cred = await findCredential(e);

  if (cred?.passwordHash) {
    try {
      await adminDb.auth.sendMagicCode(e);
    } catch (error) {
      console.error("Password reset email could not be sent", error);
    }
  }

  return { ok: true };
}

/** Verify the emailed code, then replace the stored password hash. */
export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<{ ok: true }> {
  const e = email.trim().toLowerCase();
  const cred = await findCredential(e);

  if (!cred?.passwordHash) {
    throw new HttpError(400, "Code invalide ou expiré.");
  }

  try {
    await adminDb.auth.checkMagicCode(e, code.trim());
  } catch {
    throw new HttpError(400, "Code invalide ou expiré.");
  }

  await adminDb.transact(
    adminDb.tx.credentials[cred.id].update({ passwordHash: hashPassword(password) }),
  );

  return { ok: true };
}
