import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("EXPO_PUBLIC_API_URL", "https://mobile.test.invalid");

const { submitMobileProductFeedback, submitMobileTripReview } = await import("./feedback");

describe("mobile feedback API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("submits product feedback to the shared API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "feedback-1" }) });
    vi.stubGlobal("fetch", fetchMock);

    await submitMobileProductFeedback({
      source: "mobile",
      category: "bug",
      name: "Mialy",
      email: "mialy@example.test",
      message: "Le bouton de paiement ne répond pas.",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://mobile.test.invalid/api/feedback/product",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces a rejected trip review", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Cette réservation a déjà été évaluée." }),
    }));

    await expect(submitMobileTripReview({
      bookingReference: "CP-ABC123",
      name: "Mialy",
      email: "mialy@example.test",
      rating: 5,
      comment: "Voyage ponctuel et équipe accueillante.",
    })).rejects.toThrow("Cette réservation a déjà été évaluée.");
  });
});
