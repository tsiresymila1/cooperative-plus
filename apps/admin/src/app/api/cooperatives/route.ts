import { NextResponse } from "next/server";
import { adminDb, id } from "@cp/instant/admin";
import { hashPassword } from "@cp/instant/password";

// Create a cooperative + (optional) subscription + owner account with a usable password.
// Owner login (email+password) happens on the coop app via /api/auth/password.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slug = String(body.slug ?? "").trim().toLowerCase();
    const displayName = String(body.displayName ?? "").trim();
    const legalName = String(body.legalName ?? "").trim();
    const region = String(body.region ?? "").trim();
    const planId = String(body.planId ?? "").trim();
    const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
    const ownerName = String(body.ownerName ?? "").trim();
    const ownerPassword = String(body.ownerPassword ?? "");

    if (!slug || !displayName || !legalName) {
      return NextResponse.json({ error: "Slug, nom commercial et raison sociale requis." }, { status: 400 });
    }
    if (ownerEmail && ownerPassword.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères." }, { status: 400 });
    }

    const { cooperatives } = await adminDb.query({ cooperatives: { $: { where: { slug } } } });
    if (cooperatives?.[0]) {
      return NextResponse.json({ error: `Le slug "${slug}" est déjà utilisé.` }, { status: 409 });
    }

    const now = Date.now();
    const coopId = id();
    const chunks: any[] = [
      adminDb.tx.cooperatives[coopId].update({
        slug,
        displayName,
        legalName,
        region: region || undefined,
        currency: "MGA",
        timezone: "Indian/Antananarivo",
        subscriptionStatus: "active",
        cutoffHours: 2,
        refundPct: 50,
        createdAt: now,
      }),
    ];

    if (planId) {
      chunks.push(
        adminDb.tx.subscriptions[id()]
          .update({ status: "active", createdAt: now })
          .link({ cooperative: coopId, plan: planId }),
      );
    }

    if (ownerEmail) {
      // Ensure the $user exists (createToken creates it if missing).
      await adminDb.auth.createToken(ownerEmail);
      const { $users } = await adminDb.query({ $users: { $: { where: { email: ownerEmail } } } });
      const user = $users?.[0];
      if (!user) return NextResponse.json({ error: "Impossible de créer le compte propriétaire." }, { status: 500 });

      if (ownerName) chunks.push(adminDb.tx.$users[user.id].update({ name: ownerName }));

      // Upsert password credential.
      const { credentials } = await adminDb.query({ credentials: { $: { where: { email: ownerEmail } } } });
      const credId = credentials?.[0]?.id ?? id();
      chunks.push(
        adminDb.tx.credentials[credId].update({
          email: ownerEmail,
          passwordHash: hashPassword(ownerPassword),
          createdAt: now,
        }),
      );

      chunks.push(
        adminDb.tx.memberships[id()]
          .update({ role: "owner", permissions: [], status: "active", createdAt: now })
          .link({ cooperative: coopId, user: user.id }),
      );
    }

    await adminDb.transact(chunks);
    return NextResponse.json({ ok: true, coopId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Échec de la création." }, { status: 500 });
  }
}
