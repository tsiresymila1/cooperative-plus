import { beforeEach, describe, expect, it, vi } from "vitest";

const paymentService = vi.hoisted(() => ({
  initiatePayment: vi.fn(),
  handleWebhook: vi.fn(),
}));

const feedbackService = vi.hoisted(() => ({
  submitProductFeedback: vi.fn(),
  submitTripReview: vi.fn(),
  uploadFeedbackScreenshot: vi.fn(),
}));

vi.mock("./services/payment", () => paymentService);
vi.mock("./services/feedback", () => feedbackService);

import { HttpError } from "./errors";
import { app } from "./router";

const postJson = (path: string, body: unknown) =>
  app.request(`https://client.test.invalid${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("client HTTP router", () => {
  beforeEach(() => {
    paymentService.initiatePayment.mockReset();
    paymentService.handleWebhook.mockReset();
    feedbackService.submitProductFeedback.mockReset();
    feedbackService.submitTripReview.mockReset();
    feedbackService.uploadFeedbackScreenshot.mockReset();
  });

  it("validates and forwards a payment initiation request", async () => {
    paymentService.initiatePayment.mockResolvedValueOnce({
      url: "https://checkout.test.invalid/payment-1",
    });

    const response = await postJson("/api/payment/initiate", {
      bookingReference: "CP-ABC123",
      coopId: "coop-1",
      seatMeta: [{ label: "A1", passengerName: "Mialy", price: 25_000 }],
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.test.invalid/payment-1",
    });
    expect(paymentService.initiatePayment).toHaveBeenCalledWith({
      bookingReference: "CP-ABC123",
      instanceId: undefined,
      coopId: "coop-1",
      holdIds: undefined,
      seatMeta: [{ label: "A1", passengerName: "Mialy", price: 25_000 }],
      tripVehicleId: null,
    });
  });

  it("rejects malformed payment input before the service boundary", async () => {
    const response = await postJson("/api/payment/initiate", {
      bookingReference: "",
      seatMeta: [{ label: "A1", passengerName: "Mialy", price: "25000" }],
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(paymentService.initiatePayment).not.toHaveBeenCalled();
  });

  it("maps service authorization errors to the public JSON contract", async () => {
    paymentService.initiatePayment.mockRejectedValueOnce(
      new HttpError(401, "Paiement non autorisé"),
    );

    const response = await postJson("/api/payment/initiate", {
      bookingReference: "CP-UNAUTHORIZED",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Paiement non autorisé" });
  });

  it("acknowledges a webhook only after the provider boundary succeeds", async () => {
    paymentService.handleWebhook.mockResolvedValueOnce(undefined);

    const payload = {
      paymentStatus: "SUCCESS",
      merchantPaymentReference: "CP-ABC123",
      notificationToken: "test-notification-token",
    };
    const response = await postJson("/api/payment/webhook", payload);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(paymentService.handleWebhook).toHaveBeenCalledWith(payload);
  });
});

describe("feedback HTTP router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates and creates product feedback", async () => {
    feedbackService.submitProductFeedback.mockResolvedValueOnce({ id: "feedback-1" });

    const response = await postJson("/api/feedback/product", {
      source: "mobile",
      category: "suggestion",
      name: " Mialy ",
      email: " MIALY@example.test ",
      message: "Ajouter une alerte avant le départ.",
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "feedback-1" });
    expect(feedbackService.submitProductFeedback).toHaveBeenCalledWith({
      source: "mobile",
      category: "suggestion",
      name: "Mialy",
      email: "mialy@example.test",
      message: "Ajouter une alerte avant le départ.",
    });
  });

  it("rejects an invalid trip review before the service boundary", async () => {
    const response = await postJson("/api/feedback/trip-review", {
      bookingReference: "CP-ABC123",
      name: "Mialy",
      email: "mialy@example.test",
      rating: 7,
      comment: "Voyage ponctuel et équipe accueillante.",
    });

    expect(response.status).toBe(400);
    expect(feedbackService.submitTripReview).not.toHaveBeenCalled();
  });

  it("forwards a valid trip review", async () => {
    feedbackService.submitTripReview.mockResolvedValueOnce({ id: "review-1" });

    const response = await postJson("/api/feedback/trip-review", {
      bookingReference: "cp-abc123",
      name: "Mialy",
      email: "mialy@example.test",
      rating: 5,
      comment: "Voyage ponctuel et équipe accueillante.",
    });

    expect(response.status).toBe(201);
    expect(feedbackService.submitTripReview).toHaveBeenCalledWith(
      expect.objectContaining({ bookingReference: "CP-ABC123", rating: 5 }),
    );
  });

  it("uploads a supported screenshot", async () => {
    feedbackService.uploadFeedbackScreenshot.mockResolvedValueOnce({
      url: "https://files.example.test/capture.png",
    });
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1, 2, 3])], "capture.png", { type: "image/png" }));

    const response = await app.request("https://client.test.invalid/api/feedback/upload", {
      method: "POST",
      body: form,
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      url: "https://files.example.test/capture.png",
    });
    expect(feedbackService.uploadFeedbackScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "image/png", fileName: "capture.png" }),
    );
  });
});
