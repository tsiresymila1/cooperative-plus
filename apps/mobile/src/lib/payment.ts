import * as WebBrowser from "expo-web-browser";

// Base URL of the client web app — it owns the PAPI integration
// (/api/payment/initiate + the PAPI webhook that issues tickets on success).
const API = process.env.EXPO_PUBLIC_API_URL ?? "";

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
