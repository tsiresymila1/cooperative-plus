import { adminDb } from "@cp/instant/admin";
import { dueStatus } from "@cp/instant/subscription";

export const runtime = "nodejs"; // adminDb (admin token) needs Node

/**
 * Daily lifecycle sweep: trial→past_due→suspended based on due dates.
 * Wired via vercel.json crons. Protected by CRON_SECRET (Vercel sends it).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });

  const now = Date.now();
  const { subscriptions } = await adminDb.query({ subscriptions: { cooperative: {} } });

  const chunks: any[] = [];
  for (const s of subscriptions ?? []) {
    const next = dueStatus(s as any, now);
    if (!next) continue;
    chunks.push(adminDb.tx.subscriptions[s.id].update({ status: next }));
    const coopId = (s as any).cooperative?.id;
    // Coop mirror gates access: only "suspended" blocks; past_due keeps access (grace).
    if (coopId)
      chunks.push(adminDb.tx.cooperatives[coopId].update({ subscriptionStatus: next === "suspended" ? "suspended" : "active" }));
  }
  if (chunks.length) await adminDb.transact(chunks);

  return Response.json({ ok: true, changed: chunks.length / 2 });
}
