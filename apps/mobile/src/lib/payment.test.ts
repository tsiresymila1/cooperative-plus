import { beforeEach, describe, expect, it, vi } from "vitest";

const webBrowser = vi.hoisted(() => ({
  openAuthSessionAsync: vi.fn(),
}));

vi.mock("expo-web-browser", () => webBrowser);
vi.stubEnv("EXPO_PUBLIC_API_URL", "https://mobile.test.invalid");

const { openPapi } = await import("./payment");

describe("openPapi", () => {
  beforeEach(() => {
    webBrowser.openAuthSessionAsync.mockReset();
  });

  it("maps the success redirect and uses the app booking callback", async () => {
    webBrowser.openAuthSessionAsync.mockResolvedValueOnce({
      type: "success",
      url: "https://mobile.test.invalid/bookings/CP-ABC123?payment=success",
    });

    await expect(openPapi("https://checkout.test.invalid/payment-1")).resolves.toBe("success");
    expect(webBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      "https://checkout.test.invalid/payment-1",
      "https://mobile.test.invalid/bookings/",
    );
  });

  it("maps any non-success payment redirect to failed", async () => {
    webBrowser.openAuthSessionAsync.mockResolvedValueOnce({
      type: "success",
      url: "https://mobile.test.invalid/bookings/CP-ABC123?payment=failed",
    });

    await expect(openPapi("https://checkout.test.invalid/payment-2")).resolves.toBe("failed");
  });

  it.each([{ type: "cancel" }, { type: "dismiss" }])(
    "maps a $type browser outcome to dismiss",
    async (outcome) => {
      webBrowser.openAuthSessionAsync.mockResolvedValueOnce(outcome);

      await expect(openPapi("https://checkout.test.invalid/payment-3")).resolves.toBe("dismiss");
    },
  );
});
