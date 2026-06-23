"use client";
import { ProgressProvider } from "@bprogress/next/app";

// Top navigation progress bar. Colour follows the admin theme accent
// (--color-laterite, which also flips in dark mode).
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
