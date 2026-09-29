import { beforeEach, describe, expect, it, vi } from "vitest";

const webBrowser = vi.hoisted(() => ({
  openAuthSessionAsync: vi.fn(),
}));

vi.mock("expo-web-browser", () => webBrowser);
vi.stubEnv("EXPO_PUBLIC_API_URL", "https://mobile.test.invalid");

const { initiatePapi, openPapi } = await import("./payment");

describe("initiatePapi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("posts the booking details and returns the hosted payment URL", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: "https://checkout.test.invalid/payment-1" }),
    });

    const input = {
      bookingReference: "CP-ABC123",
      instanceId: "trip-1",
      coopId: "coop-1",
      holdIds: ["hold-1"],
      seatMeta: [{ label: "A1", passengerName: "Mialy", price: 25_000 }],
      tripVehicleId: "vehicle-1",
    };

    await expect(initiatePapi(input)).resolves.toBe("https://checkout.test.invalid/payment-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mobile.test.invalid/api/payment/initiate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
  });

  it("surfaces the provider error returned by the server", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: "Paiement refusé" }),
    });

    await expect(initiatePapi({ bookingReference: "CP-FAILED" })).rejects.toThrow(
      "Paiement refusé",
    );
  });

  it("uses a stable fallback when the response is not JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockRejectedValue(new SyntaxError("invalid json")),
    });

    await expect(initiatePapi({ bookingReference: "CP-BADJSON" })).rejects.toThrow(
      "Paiement en ligne indisponible",
    );
  });
});

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
