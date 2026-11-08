import { createHash } from "node:crypto";
import { adminDb, id } from "./admin";

/** Shared across server instances; unique slots serialize concurrent requests. */
export async function consumeRateLimit(identity: string, scope: string, limit: number, now = Date.now()): Promise<boolean> {
  const bucket = createHash("sha256").update(`${scope}:${identity}:${Math.floor(now / 60_000)}`).digest("hex");
  const { rateLimits } = await adminDb.query({ rateLimits: { $: { where: { bucket } } } });
  const occupied = new Set(rateLimits.map(row => row.key));
  for (let slot = 0; slot < limit; slot++) {
    const key = `${bucket}_${slot}`;
    if (occupied.has(key)) continue;
    try {
      await adminDb.transact(adminDb.tx.rateLimits[id()]!.update({ key, bucket, createdAt: now }));
      return true;
    } catch (error) {
      const { rateLimits: collision } = await adminDb.query({ rateLimits: { $: { where: { key } } } });
      if (!collision.length) throw error;
    }
  }
  return false;
}

export async function cleanRateLimits(now = Date.now()) {
  while (true) {
    const { rateLimits } = await adminDb.query({ rateLimits: { $: { where: { createdAt: { $lt: new Date(now - 24 * 60 * 60_000) } }, limit: 1000 } } });
    if (!rateLimits.length) return;
    await adminDb.transact(rateLimits.map(row => adminDb.tx.rateLimits[row.id]!.delete()));
  }
}
