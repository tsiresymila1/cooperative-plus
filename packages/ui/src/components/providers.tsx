"use client";
import { ConfirmRoot } from "./confirm";
import { VisitTracker } from "./visit-tracker";
// InstantDB has its own reactivity (db.useQuery) — no extra client cache needed.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConfirmRoot />
      <VisitTracker />
    </>
  );
}
