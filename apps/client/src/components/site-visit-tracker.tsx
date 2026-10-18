"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getConsent, onConsentChange } from "@cp/ui";

/** Anonymous visitor counter: after RGPD consent, pings /api/track once per
 *  browser session with a random per-browser id (no IP, no geo). */
export function SiteVisitTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<string | null>(null);
  useEffect(() => {
    setConsent(getConsent());
    return onConsentChange(() => setConsent(getConsent()));
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return;
    try {
      if (sessionStorage.getItem("cp_site_visit")) return;
      let vid = localStorage.getItem("cp_visitor_id");
      if (!vid) localStorage.setItem("cp_visitor_id", (vid = crypto.randomUUID()));
      sessionStorage.setItem("cp_site_visit", "1");
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitorId: vid, path: pathname }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* storage blocked — skip tracking */
    }
  }, [consent, pathname]);
  return null;
}
