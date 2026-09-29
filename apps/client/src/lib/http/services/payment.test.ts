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
    tickets: {},
    seatHolds: {},
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
    instantAdmin.query.mockResolvedValueOnce(bookingWithTokenHash());

    await expect(
      handleWebhook({ ...payload, notificationToken: "test-incoming-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a webhook when its notification token is missing", async () => {
    instantAdmin.query.mockResolvedValueOnce(bookingWithTokenHash(hashSecret("test-stored-token")));

    await expect(handleWebhook(payload)).rejects.toMatchObject({
      status: 401,
      message: "notificationToken invalide",
    });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a mismatched notification token", async () => {
    instantAdmin.query.mockResolvedValueOnce(bookingWithTokenHash(hashSecret("test-stored-token")));

    await expect(
      handleWebhook({ ...payload, notificationToken: "test-other-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("accepts the exact token matching the stored fingerprint", async () => {
    instantAdmin.query.mockResolvedValueOnce(
      bookingWithTokenHash(hashSecret("test-stored-token")),
    );

    await expect(
      handleWebhook({ ...payload, notificationToken: "test-stored-token" }),
    ).resolves.toBeUndefined();
    expect(instantAdmin.transact).toHaveBeenCalledOnce();
  });

  it("temporarily accepts an exact legacy token during the migration window", async () => {
    instantAdmin.query.mockResolvedValueOnce(bookingWithLegacyToken("legacy-token"));

    await expect(
      handleWebhook({ ...payload, notificationToken: "legacy-token" }),
    ).resolves.toBeUndefined();
    expect(instantAdmin.transact).toHaveBeenCalledOnce();
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
    tripInstance: { id: "instance-1" },
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

    await expect(initiatePayment({ bookingReference: booking.reference })).rejects.toMatchObject({
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

    await expect(initiatePayment({ bookingReference: booking.reference })).resolves.toEqual({
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
