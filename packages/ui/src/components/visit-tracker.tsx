"use client";
import { useEffect, useState } from "react";
import { db, lookup } from "../lib/db";
import { getConsent, onConsentChange } from "./cookie-consent";

/**
 * Platform analytics: once per browser session, upsert the signed-in user's
 * visit row with their IP + approximate geolocation (via ipwho.is, keyless).
 * Read only by platform admins (see perms). No-op for guests / logged-out.
 */
export function VisitTracker() {
  const { user } = db.useAuth();
  // Re-run once the visitor accepts, without a reload.
  const [consent, setConsent] = useState<"accepted" | "rejected" | null>(null);
  useEffect(() => {
    setConsent(getConsent());
    return onConsentChange(() => setConsent(getConsent()));
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return; // RGPD: no tracking without consent
    const u = user as { id: string; email?: string; isGuest?: boolean } | null | undefined;
    if (!u?.id || u.isGuest) return;
    const key = `cp_visit_${u.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — track anyway, at most once per load */
    }
    (async () => {
      let g: Record<string, unknown> = {};
      try {
        const r = await fetch("https://ipwho.is/");
        if (r.ok) g = await r.json();
      } catch {
        /* geo lookup best-effort */
      }
      const now = Date.now();
      try {
        await db.transact(
          db.tx.visits[lookup("userId", u.id)]
            .update({
              userId: u.id,
              email: u.email,
              ip: (g.ip as string) ?? undefined,
              city: (g.city as string) ?? undefined,
              region: (g.region as string) ?? undefined,
              country: (g.country as string) ?? undefined,
              lat: (g.latitude as number) ?? undefined,
              lng: (g.longitude as number) ?? undefined,
              userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
              app: typeof window !== "undefined" ? window.location.host : undefined,
              createdAt: now,
              lastSeenAt: now,
            })
            .link({ user: u.id }),
        );
      } catch {
        /* perms / offline — non-critical */
      }
    })();
  }, [user, consent]);
  return null;
}
