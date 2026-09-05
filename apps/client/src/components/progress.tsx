"use client";
import { ProgressProvider } from "@bprogress/next/app";

export function Progress({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider color="#D9A441" height="3px" options={{ showSpinner: false }} shallowRouting>
      {children}
    </ProgressProvider> 
  );
}
