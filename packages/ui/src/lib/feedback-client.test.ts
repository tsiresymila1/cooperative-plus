import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitProductFeedbackForm, submitTripReviewForm } from "./feedback-client";

describe("feedback client", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uploads an optional image before submitting product feedback", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ url: "https://files.test/capture.png" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "feedback-1" }) });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File([new Uint8Array([1])], "capture.png", { type: "image/png" });

    await submitProductFeedbackForm("https://api.test", {
      source: "client_web",
      category: "bug",
      name: "Mialy",
      email: "mialy@example.test",
      message: "Le bouton de paiement ne répond pas.",
    }, file);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.test/api/feedback/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body)).toMatchObject({
      screenshotUrl: "https://files.test/capture.png",
    });
  });

  it("surfaces the API error when a trip review is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Cette réservation a déjà été évaluée." }),
    }));

    await expect(submitTripReviewForm("", {
      bookingReference: "CP-ABC123",
      name: "Mialy",
      email: "mialy@example.test",
      rating: 5,
      comment: "Voyage ponctuel et équipe accueillante.",
    })).rejects.toThrow("Cette réservation a déjà été évaluée.");
  });
});
