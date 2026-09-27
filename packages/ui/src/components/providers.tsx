"use client";
import { ConfirmRoot } from "./confirm";
import { VisitTracker } from "./visit-tracker";
import { CookieConsent } from "./cookie-consent";
// InstantDB has its own reactivity (db.useQuery) — no extra client cache needed.
export function Providers({ children, askConsentement=false }: { children: React.ReactNode, askConsentement?: boolean }) {
  return (
    <>
      {children}
      <ConfirmRoot />
      {askConsentement && <>
        <VisitTracker />
        <CookieConsent />
      </>}
    </>
  );
}
