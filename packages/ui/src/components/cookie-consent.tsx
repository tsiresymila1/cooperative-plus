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
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 border border-white/10 bg-[#0b1d44] p-7 text-white shadow-[0_30px_80px_-24px_rgba(0,0,0,.7)] lg:flex-row lg:items-center lg:gap-10 lg:p-9">
        <div className="flex-1">
          <h3 className="font-display text-2xl font-semibold uppercase leading-tight tracking-[-0.5px] text-white">
            Votre vie privée
          </h3>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/75">
            Nous utilisons des cookies et des mesures d'audience — dont votre adresse IP
            et une localisation approximative — pour améliorer le service. Elles ne sont
            activées qu'avec votre accord.{" "}
            <a href={privacyHref} className="font-medium text-gold underline underline-offset-2 hover:text-white">
              En savoir plus
            </a>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="inline-flex h-[52px] items-center justify-center border border-white/30 px-7 font-display text-[15px] font-semibold uppercase tracking-[0.5px] text-white transition-colors duration-200 hover:bg-white hover:text-navy"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="inline-flex h-[52px] items-center justify-center bg-gold px-7 font-display text-[15px] font-semibold uppercase tracking-[0.5px] text-navy transition-colors duration-200 hover:bg-white"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
