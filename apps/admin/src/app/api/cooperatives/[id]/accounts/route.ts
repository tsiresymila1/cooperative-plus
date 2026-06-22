import { NextResponse } from "next/server";
import { adminDb, id as newId } from "@cp/instant/admin";
import { hashPassword } from "@cp/instant/password";

// Attach an account (owner|assistant) with a usable password to a cooperative.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: coopId } = await params;
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const role = body.role === "assistant" ? "assistant" : "owner";

    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères." }, { status: 400 });
    }

    const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { id: coopId } } } });
    if (!cooperatives?.[0]) return NextResponse.json({ error: "Coopérative introuvable." }, { status: 404 });

    await adminDb.auth.createToken(email); // ensure $user exists
    const { $users } = await adminDb.query({ $users: { $: { where: { email } } } });
    const user = $users?.[0];
    if (!user) return NextResponse.json({ error: "Impossible de créer le compte." }, { status: 500 });

    const now = Date.now();
    const chunks: any[] = [];
    if (name) chunks.push(adminDb.tx.$users[user.id].update({ name }));

    const { credentials } = await adminDb.query({ credentials: { $: { where: { email } } } });
    const credId = credentials?.[0]?.id ?? newId();
    chunks.push(
      adminDb.tx.credentials[credId].update({ email, passwordHash: hashPassword(password), createdAt: now }),
    );

    // Upsert membership (avoid duplicate for same user+coop).
    const { memberships } = await adminDb.query({
      memberships: { $: { where: { "user.id": user.id, "cooperative.id": coopId } } },
    });
    const memId = memberships?.[0]?.id ?? newId();
    chunks.push(
      adminDb.tx.memberships[memId]
        .update({ role, permissions: [], status: "active", createdAt: memberships?.[0]?.createdAt ?? now })
        .link({ cooperative: coopId, user: user.id }),
    );

    await adminDb.transact(chunks);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Échec." }, { status: 500 });
  }
}
