import { beforeEach, describe, expect, it, vi } from "vitest";

const instantAdmin = vi.hoisted(() => ({
  query: vi.fn(),
  transact: vi.fn(),
  newId: vi.fn(),
  tx: {
    payments: new Proxy({}, {
      get: (_target, id) => ({
        update: (data: unknown) => ({
          namespace: "payments",
          id: String(id),
          data,
          link: (links: unknown) => ({ namespace: "payments", id: String(id), data, links }),
        }),
      }),
    }),
    bookings: new Proxy({}, {
      get: (_target, id) => ({
        update: (data: unknown) => ({ namespace: "bookings", id: String(id), data }),
      }),
    }),
    tickets: new Proxy({}, { get: (_, id) => ({ update: (data: unknown) => ({ link: (links: unknown) => ({ namespace: "tickets", id, data, links }) }) }) }),
    seatHolds: new Proxy({}, { get: (_, id) => ({ delete: () => ({ namespace: "seatHolds", id, deleted: true }) }) }),
  },
}));

vi.mock("@cp/instant/admin", () => ({
  adminDb: {
    query: instantAdmin.query,
    transact: instantAdmin.transact,
    tx: instantAdmin.tx,
  },
  id: instantAdmin.newId,
}));

import { hashSecret } from "@cp/crypto";
import { handleWebhook, initiatePayment } from "./payment";

const payload = {
  paymentStatus: "SUCCESS",
  merchantPaymentReference: "CP-TEST01",
};

function bookingWithTokenHash(notificationTokenHash?: string) {
  return {
    payments: [],
    bookings: [
      {
        id: "booking-1",
        status: "pending",
        payments: [
          {
            id: "payment-1",
            status: "pending",
            meta: notificationTokenHash ? { notificationTokenHash } : {},
          },
        ],
      },
    ],
  };
}

function bookingWithLegacyToken(notificationToken: string) {
  return {
    payments: [],
    bookings: [
      {
        id: "booking-1",
        status: "pending",
        payments: [
          {
            id: "payment-1",
            status: "pending",
            meta: { notificationToken },
          },
        ],
      },
    ],
  };
}

describe("client PAPI webhook authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a webhook when no notification token was persisted", async () => {
    instantAdmin.query.mockResolvedValue(bookingWithTokenHash());

    await expect(
      handleWebhook({ ...payload, notificationToken: "test-incoming-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a webhook when its notification token is missing", async () => {
    instantAdmin.query.mockResolvedValue(bookingWithTokenHash(hashSecret("test-stored-token")));

    await expect(handleWebhook(payload)).rejects.toMatchObject({
      status: 401,
      message: "notificationToken invalide",
    });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a mismatched notification token", async () => {
    instantAdmin.query.mockResolvedValue(bookingWithTokenHash(hashSecret("test-stored-token")));

    await expect(
      handleWebhook({ ...payload, notificationToken: "test-other-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("accepts the exact token matching the stored fingerprint", async () => {
    instantAdmin.query.mockResolvedValue(
      bookingWithTokenHash(hashSecret("test-stored-token")),
    );

    await expect(
      handleWebhook({ ...payload, notificationToken: "test-stored-token" }),
    ).resolves.toBeUndefined();
    expect(instantAdmin.transact).toHaveBeenCalledOnce();
  });

  it("rejects a legacy raw token after the migration window", async () => {
    instantAdmin.query.mockResolvedValue(bookingWithLegacyToken("legacy-token"));

    await expect(
      handleWebhook({ ...payload, notificationToken: "legacy-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });
});

describe("client PAPI payment initiation", () => {
  const booking = {
    id: "booking-1",
    reference: "CP-TEST01",
    status: "pending",
    totalAmount: 25_000,
    currency: "MGA",
    contactName: "Test Rider",
    cooperative: { id: "coop-1", secrets: { papiApiKey: "test-papi-key" } },
    customer: { id: "user-1" }, tickets: [{ id: "ticket-1" }], payments: [], seatCount: 1,
    tripInstance: { id: "instance-1", price: 25_000, currency: "MGA" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    instantAdmin.query.mockResolvedValue({ bookings: [booking] });
    instantAdmin.newId.mockReturnValue("payment-1");
  });

  it("rejects a provider response that omits the webhook token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { paymentLink: "https://pay.test/1" } }),
    }));

    await expect(initiatePayment({ bookingReference: booking.reference, userId: "user-1" })).rejects.toMatchObject({
      status: 502,
    });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("stores only a fingerprint of the provider webhook token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { paymentLink: "https://pay.test/1", notificationToken: "provider-secret" },
      }),
    }));

    await expect(initiatePayment({ bookingReference: booking.reference, userId: "user-1" })).resolves.toEqual({
      url: "https://pay.test/1",
    });
    expect(instantAdmin.transact).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          meta: expect.objectContaining({
            notificationTokenHash: hashSecret("provider-secret"),
          }),
        }),
      }),
    );
    const transaction = instantAdmin.transact.mock.calls[0]?.[0];
    expect(JSON.stringify(transaction)).not.toContain("provider-secret");
  });
});


describe("payment state transitions", () => {
  const payment = { id: "payment-current", amount: 25_000, currency: "MGA", status: "pending",
    meta: { notificationTokenHash: hashSecret("valid-token"), seatMeta: [] },
    booking: { id: "booking-1", status: "pending", tickets: [] } };
  beforeEach(() => { vi.resetAllMocks(); instantAdmin.transact.mockResolvedValue({}); });
  it("uses the matching attempt instead of the first payment", async () => {
    instantAdmin.query.mockResolvedValue({ payments: [
      { ...payment, id: "old-payment", meta: { notificationTokenHash: hashSecret("old-token") } }, payment,
    ] });
    await handleWebhook({ ...payload, notificationToken: "valid-token" });
    expect(instantAdmin.transact.mock.calls[0][0][0].id).toBe("payment-current");
  });
  it.each([{ amount: 1 }, { currency: "EUR" }])("rejects a mismatched payment %j", async extra => {
    instantAdmin.query.mockResolvedValue({ payments: [payment] });
    await expect(handleWebhook({ ...payload, ...extra, notificationToken: "valid-token" })).rejects.toMatchObject({ status: 409 });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });
  it("acknowledges authenticated duplicates without reissuing tickets", async () => {
    instantAdmin.query.mockResolvedValue({ payments: [{ ...payment, status: "paid" }] });
    await handleWebhook({ ...payload, notificationToken: "valid-token" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });
  it("does not reset a paid booking when an older attempt fails", async () => {
    instantAdmin.query.mockResolvedValue({ payments: [{ ...payment, booking: { ...payment.booking, status: "paid" } }] });
    await handleWebhook({ ...payload, paymentStatus: "FAILED", notificationToken: "valid-token" });
    expect(instantAdmin.transact.mock.calls[0][0].find((c: any) => c.namespace === "bookings").data.status).toBe("paid");
  });
  it("records late money without resurrecting a cancelled reservation's tickets", async () => {
    instantAdmin.query.mockResolvedValue({ payments: [{ ...payment, booking: { ...payment.booking, status: "cancelled" } }] });
    await handleWebhook({ ...payload, notificationToken: "valid-token" });
    const chunks = instantAdmin.transact.mock.calls[0][0];
    expect(chunks[0].data.status).toBe("paid");
    expect(chunks[1].data.status).toBe("payment_review");
    expect(chunks.some((c: any) => c.namespace === "tickets")).toBe(false);
  });
  it("retains the receipt when a seat conflict rejects ticket creation", async () => {
    instantAdmin.query.mockResolvedValueOnce({ payments: [{ ...payment, meta: { ...payment.meta,
      instanceId: "trip", seatMeta: [{ label: "1", passengerName: "Rider", price: 25_000, ticketId: "stable-ticket" }],
    } }] }).mockResolvedValueOnce({ tickets: [] });
    instantAdmin.transact.mockRejectedValueOnce(new Error("seatKey already used"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await handleWebhook({ ...payload, notificationToken: "valid-token" });
    const receipt = instantAdmin.transact.mock.calls[1][0];
    expect(receipt[0].data).toMatchObject({ status: "paid", meta: { allocationError: true } });
    expect(receipt[1].data.status).toBe("payment_review");
  });
  it("rejects paying another user's reservation before calling PAPI", async () => {
    instantAdmin.query.mockResolvedValue({ bookings: [{ id: "booking", customer: { id: "other-user" } }] });
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(initiatePayment({ bookingReference: "CP-TEST", userId: "user" })).rejects.toMatchObject({ status: 403 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
