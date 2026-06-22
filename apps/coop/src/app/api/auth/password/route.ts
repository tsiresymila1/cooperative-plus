import { adminDb } from "@cp/instant/admin";
import { verifyPassword } from "@cp/instant/password";

export const runtime = "nodejs";

// Custom auth (InstantDB): verify email+password against `credentials`, then
// mint an Instant token the client exchanges via db.auth.signInWithToken.
export async function POST(req: Request) {
  let email = "", password = "";
  try { ({ email, password } = await req.json()); } catch { /* noop */ }
  email = (email ?? "").trim().toLowerCase();
  if (!email || !password) return Response.json({ error: "Email et mot de passe requis." }, { status: 400 });

  try {
    const r = await adminDb.query({ credentials: { $: { where: { email } } } });
    const cred = (r.credentials ?? [])[0] as { passwordHash?: string } | undefined;
    if (!cred?.passwordHash || !verifyPassword(password, cred.passwordHash)) {
      return Response.json({ error: "Identifiants invalides." }, { status: 401 });
    }
    const token = await adminDb.auth.createToken(email);
    return Response.json({ token });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Erreur serveur" }, { status: 500 });
  }
}
