"use client";
import { useCallback, useRef } from "react";

const PAPI_ORIGIN = "https://payment-form.papi.mg";

type Result = "success" | "failed" | "closed";

/** Opens the PAPI hosted payment form in a popup and reports the outcome.
 * Falls back to a full-page redirect if the popup is blocked. */
export function usePaymentPopup(onResult: (result: Result) => void) {
  const popupRef = useRef<Window | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  const cleanup = () => {
    if (listenerRef.current) {
      window.removeEventListener("message", listenerRef.current);
      listenerRef.current = null;
    }
  };

  const open = useCallback(
    (url: string) => {
      cleanup();
      const popup = window.open(url, "payment-form-window", "width=500,height=700");
      popupRef.current = popup;
      if (!popup) {
        window.location.href = url;
        return;
      }
      const handler = (event: MessageEvent) => {
        if (event.origin !== PAPI_ORIGIN) return;
        if (event.source !== popupRef.current) return;
        if (event.data?.type !== "PAYMENT_STATUS") return;
        cleanup();
        popup.close();
        const status = String(event.data?.status ?? "").toUpperCase();
        onResult(status === "SUCCESS" ? "success" : "failed");
      };
      listenerRef.current = handler;
      window.addEventListener("message", handler);
      const timer = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(timer);
          cleanup();
          onResult("closed");
        }
      }, 500);
    },
    [onResult],
  );

  return { open };
}
