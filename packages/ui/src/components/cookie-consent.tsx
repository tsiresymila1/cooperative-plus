"use client";
import { useEffect, useState } from "react";

const KEY = "cp_consent"; // "accepted" | "rejected"
const EVENT = "cp-consent-change";

export function getConsent(): "accepted" | "rejected" | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: "accepted" | "rejected") {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Subscribe to consent changes (returns an unsubscribe fn). */
export function onConsentChange(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/**
 * RGPD/cookie consent banner. Privacy-first: analytics (IP + geolocation via
 * VisitTracker) stay OFF until the visitor explicitly accepts. The choice is
 * remembered per browser; refusing is a valid, permanent choice.
 */
export function CookieConsent({ privacyHref = "/privacy" }: { privacyHref?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (getConsent() === null) setShow(true);
  }, []);
  if (!show) return null;

  const choose = (v: "accepted" | "rejected") => {
    setConsent(v);
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-white/10 bg-[#0b1d44] p-4 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)] sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="flex-1 text-sm leading-relaxed text-white/80">
          Nous utilisons des cookies et des mesures d'audience (dont votre adresse IP
          et une localisation approximative) pour améliorer le service. Elles ne sont
          activées qu'avec votre accord.{" "}
          <a href={privacyHref} className="font-medium text-gold underline underline-offset-2 hover:text-white">
            En savoir plus
          </a>
        </p>
        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-white"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
