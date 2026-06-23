"use client";
import { ProgressProvider } from "@bprogress/next/app";

// Top navigation progress bar. Colour follows the coop theme accent
// (--color-laterite), which CoopGuard overrides per-cooperative brand colour.
export function Progress({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="3px"
      color="var(--color-laterite)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}
