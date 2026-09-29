import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.PAPI_API_KEY = "test-platform-papi-key";
});

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
    subscriptions: new Proxy({}, {
      get: (_target, id) => ({
        update: (data: unknown) => ({
          namespace: "subscriptions",
          id: String(id),
          data,
          link: (links: unknown) => ({ namespace: "subscriptions", id: String(id), data, links }),
        }),
      }),
    }),
    cooperatives: new Proxy({}, {
      get: (_target, id) => ({
        update: (data: unknown) => ({ namespace: "cooperatives", id: String(id), data }),
      }),
    }),
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
import { handleSubscriptionWebhook, initiateSubscriptionPayment } from "./subscription";

const payload = {
  paymentStatus: "SUCCESS",
  merchantPaymentReference: "SUB-TEST-1234",
};

function paymentWithTokenHash(notificationTokenHash?: string) {
  return {
    payments: [
      {
        id: "payment-1",
        status: "pending",
        meta: notificationTokenHash ? { notificationTokenHash } : {},
        subscription: { id: "subscription-1" },
        cooperative: { id: "coop-1" },
      },
    ],
  };
}

function paymentWithLegacyToken(notificationToken: string) {
  return {
    payments: [
      {
        id: "payment-1",
        status: "pending",
        meta: { notificationToken },
        subscription: { id: "subscription-1" },
        cooperative: { id: "coop-1" },
      },
    ],
  };
}

describe("subscription PAPI webhook authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a webhook when no notification token was persisted", async () => {
    instantAdmin.query.mockResolvedValueOnce(paymentWithTokenHash());

    await expect(
      handleSubscriptionWebhook({ ...payload, notificationToken: "test-incoming-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a webhook when its notification token is missing", async () => {
    instantAdmin.query.mockResolvedValueOnce(paymentWithTokenHash(hashSecret("test-stored-token")));

    await expect(handleSubscriptionWebhook(payload)).rejects.toMatchObject({
      status: 401,
      message: "notificationToken invalide",
    });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a mismatched notification token", async () => {
    instantAdmin.query.mockResolvedValueOnce(paymentWithTokenHash(hashSecret("test-stored-token")));

    await expect(
      handleSubscriptionWebhook({ ...payload, notificationToken: "test-other-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("accepts the exact token matching the stored fingerprint", async () => {
    instantAdmin.query.mockResolvedValueOnce(
      paymentWithTokenHash(hashSecret("test-stored-token")),
    );

    await expect(
      handleSubscriptionWebhook({ ...payload, notificationToken: "test-stored-token" }),
    ).resolves.toBeUndefined();
    expect(instantAdmin.transact).toHaveBeenCalledOnce();
  });

  it("rejects a legacy raw token after the migration window", async () => {
    instantAdmin.query.mockResolvedValueOnce(paymentWithLegacyToken("legacy-token"));

    await expect(
      handleSubscriptionWebhook({ ...payload, notificationToken: "legacy-token" }),
    ).rejects.toMatchObject({ status: 401, message: "notificationToken invalide" });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });
});

describe("subscription PAPI payment initiation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instantAdmin.query
      .mockResolvedValueOnce({
        cooperatives: [{
          id: "coop-1",
          slug: "test-coop",
          displayName: "Test Coop",
          subscriptions: [{ id: "subscription-1" }],
        }],
      })
      .mockResolvedValueOnce({
        plans: [{ id: "plan-1", name: "Pro", priceAmount: 50_000, currency: "MGA" }],
      });
    instantAdmin.newId.mockReturnValue("payment-1");
  });

  it("rejects a provider response that omits the webhook token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { paymentLink: "https://pay.test/sub" } }),
    }));

    await expect(initiateSubscriptionPayment({
      coopId: "coop-1",
      planId: "plan-1",
      baseUrl: "https://coop.test",
    })).rejects.toMatchObject({ status: 502 });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("stores only a fingerprint of the provider webhook token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: { paymentLink: "https://pay.test/sub", notificationToken: "provider-secret" },
      }),
    }));

    await expect(initiateSubscriptionPayment({
      coopId: "coop-1",
      planId: "plan-1",
      baseUrl: "https://coop.test",
    })).resolves.toEqual({ url: "https://pay.test/sub" });
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
