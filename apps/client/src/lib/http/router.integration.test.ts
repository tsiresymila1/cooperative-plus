import { beforeEach, describe, expect, it, vi } from "vitest";

const paymentService = vi.hoisted(() => ({
  initiatePayment: vi.fn(),
  handleWebhook: vi.fn(),
}));

vi.mock("./services/payment", () => paymentService);

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
