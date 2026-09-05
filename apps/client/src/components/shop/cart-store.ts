"use client";

import { useSyncExternalStore } from "react";

/* Minimal client-side cart: a count kept in localStorage so the header badge
   and the shop's add-to-cart control agree. No backend — this is display state
   for the clone, not a real store. */

const KEY = "tourix-cart-count";
const listeners = new Set<() => void>();

function read(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

function emit() {
  for (const l of listeners) l();
}

export function addToCart(n = 1) {
  try {
    window.localStorage.setItem(KEY, String(read() + n));
  } catch {
    /* private mode / blocked storage — badge just stays put */
  }
  emit();
}

export function useCartCount(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY) cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => 0,
  );
}
