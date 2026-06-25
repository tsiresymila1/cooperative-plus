import * as WebBrowser from "expo-web-browser";

// Base URL of the client web app — it owns the PAPI integration
// (/api/payment/initiate + the PAPI webhook that issues tickets on success).
const API = process.env.EXPO_PUBLIC_API_URL ?? "";

export type SeatMeta = { label: string; passengerName: string; price: number };

/** Ask the server to create a PAPI payment link; returns the hosted payment URL. */
export async function initiatePapi(input: {
  bookingReference: string;
  instanceId?: string;
  coopId?: string | null;
  holdIds?: string[];
  seatMeta?: SeatMeta[];
}): Promise<string> {
  const res = await fetch(`${API}/api/payment/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.error ?? "Paiement en ligne indisponible");
  return data.url as string;
}

export type PapiResult = "success" | "failed" | "dismiss";

/**
 * Open the PAPI hosted payment page. PAPI redirects to successUrl/failureUrl
 * (`${APP_URL}/bookings/<ref>?payment=...`) when done; openAuthSessionAsync
 * intercepts that redirect, auto-closes the in-app browser and returns the URL.
 */
export async function openPapi(url: string): Promise<PapiResult> {
  const res = await WebBrowser.openAuthSessionAsync(url, `${API}/bookings/`);
  if (res.type === "success" && res.url) {
    return res.url.includes("payment=success") ? "success" : "failed";
  }
  return "dismiss"; // user closed manually — webhook is still the source of truth
}
