import { beforeEach, describe, expect, it, vi } from "vitest";

const authService = vi.hoisted(() => ({
  passwordSignIn: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));
const instantAdmin = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  query: vi.fn(),
}));
const accountsService = vi.hoisted(() => ({
  createAssistant: vi.fn(),
  updateAssistant: vi.fn(),
  deleteAssistant: vi.fn(),
}));
const secretsService = vi.hoisted(() => ({ savePapiKey: vi.fn() }));
const subscriptionService = vi.hoisted(() => ({
  initiateSubscriptionPayment: vi.fn(),
  handleSubscriptionWebhook: vi.fn(),
}));

vi.mock("@cp/instant/admin", () => ({
  adminDb: {
    auth: { verifyToken: instantAdmin.verifyToken },
    query: instantAdmin.query,
  },
}));
vi.mock("./services/auth", () => authService);
vi.mock("./services/accounts", () => accountsService);
vi.mock("./services/secrets", () => secretsService);
vi.mock("./services/subscription", () => subscriptionService);

import { HttpError } from "./errors";
import { app } from "./router";

const requestJson = (
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  authorization?: string,
) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authorization) headers.Authorization = authorization;
  return app.request(`https://coop.test.invalid${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
};

const postJson = (path: string, body: unknown, authorization?: string) =>
  requestJson("POST", path, body, authorization);

const bearer = "Bearer test-coop-refresh-token";
const membership = (overrides: Record<string, unknown> = {}) => ({
  id: "membership-1",
  status: "active",
  role: "owner",
  permissions: [],
  ...overrides,
});

describe("cooperative HTTP router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instantAdmin.verifyToken.mockResolvedValue({ id: "coop-user" });
    instantAdmin.query.mockResolvedValue({
      $users: [{ id: "coop-user", isPlatformAdmin: false }],
      memberships: [membership()],
    });
  });

  it("validates and forwards password sign-in credentials", async () => {
    authService.passwordSignIn.mockResolvedValueOnce({ token: "test-session-token" });

    const response = await postJson("/api/auth/password", {
      email: "owner@example.test",
      password: "correct-horse",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ token: "test-session-token" });
    expect(authService.passwordSignIn).toHaveBeenCalledWith(
      "owner@example.test",
      "correct-horse",
    );
    expect(instantAdmin.verifyToken).not.toHaveBeenCalled();
  });

  it("rejects malformed sign-in input before the auth service", async () => {
    const response = await postJson("/api/auth/password", {
      email: "not-an-email",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(authService.passwordSignIn).not.toHaveBeenCalled();
  });

  it("maps invalid credentials to an unauthorized response", async () => {
    authService.passwordSignIn.mockRejectedValueOnce(
      new HttpError(401, "Identifiants invalides."),
    );

    const response = await postJson("/api/auth/password", {
      email: "owner@example.test",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Identifiants invalides." });
  });

  it("keeps password-reset requests account-agnostic", async () => {
    authService.requestPasswordReset.mockResolvedValueOnce({ ok: true });

    const response = await postJson("/api/auth/password/forgot", {
      email: "unknown@example.test",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(authService.requestPasswordReset).toHaveBeenCalledWith("unknown@example.test");
    expect(instantAdmin.verifyToken).not.toHaveBeenCalled();
  });

  it("keeps password reset public after validating its payload", async () => {
    authService.resetPassword.mockResolvedValueOnce({ ok: true });

    const response = await postJson("/api/auth/password/reset", {
      email: "owner@example.test",
      code: "123456",
      password: "new-secret",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(authService.resetPassword).toHaveBeenCalledWith(
      "owner@example.test",
      "123456",
      "new-secret",
    );
    expect(instantAdmin.verifyToken).not.toHaveBeenCalled();
  });

  it("rejects a weak replacement password before the auth service", async () => {
    const response = await postJson("/api/auth/password/reset", {
      email: "owner@example.test",
      code: "123456",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("validates assistant creation and forwards the parsed payload", async () => {
    accountsService.createAssistant.mockResolvedValueOnce({ ok: true });
    const payload = {
      coopId: "coop-1",
      email: "assistant@example.test",
      name: "Assistant",
      password: "secret-123",
      permissions: ["bookings:read"],
    };

    const response = await postJson("/api/team/assistant", payload, bearer);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(accountsService.createAssistant).toHaveBeenCalledWith(payload);
  });

  it("allows an owner to update an assistant membership", async () => {
    accountsService.updateAssistant.mockResolvedValueOnce({ ok: true });
    const payload = {
      coopId: "coop-1",
      membershipId: "assistant-membership",
      status: "disabled",
    };

    const response = await requestJson("PATCH", "/api/team/assistant", payload, bearer);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(accountsService.updateAssistant).toHaveBeenCalledWith(payload);
  });

  it("allows an owner to delete an assistant membership", async () => {
    accountsService.deleteAssistant.mockResolvedValueOnce({ ok: true });
    const payload = { coopId: "coop-1", membershipId: "assistant-membership" };

    const response = await requestJson("DELETE", "/api/team/assistant", payload, bearer);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(accountsService.deleteAssistant).toHaveBeenCalledWith(payload);
  });

  it("persists a valid PAPI key through the secrets boundary", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "assistant-user", isPlatformAdmin: false }],
      memberships: [membership({ role: "assistant", permissions: ["settings"] })],
    });
    secretsService.savePapiKey.mockResolvedValueOnce(undefined);

    const response = await postJson(
      "/api/secrets/papi-key",
      {
        coopId: "coop-1",
        papiApiKey: "test-papi-key",
        existingSecretId: "secret-1",
      },
      bearer,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(secretsService.savePapiKey).toHaveBeenCalledWith(
      "coop-1",
      "test-papi-key",
      "secret-1",
    );
  });

  it("derives the subscription base URL from the incoming request", async () => {
    subscriptionService.initiateSubscriptionPayment.mockResolvedValueOnce({
      url: "https://checkout.test.invalid/subscription-1",
    });

    const response = await postJson(
      "/api/subscription/initiate",
      {
        coopId: "coop-1",
        planId: "plan-1",
      },
      bearer,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.test.invalid/subscription-1",
    });
    expect(subscriptionService.initiateSubscriptionPayment).toHaveBeenCalledWith({
      coopId: "coop-1",
      planId: "plan-1",
      baseUrl: "https://coop.test.invalid",
    });
  });

  it("rejects a missing bearer session before creating an assistant", async () => {
    const response = await postJson("/api/team/assistant", {
      coopId: "coop-1",
      email: "assistant@example.test",
      password: "secret-123",
    });

    expect(response.status).toBe(401);
    expect(accountsService.createAssistant).not.toHaveBeenCalled();
  });

  it("authenticates protected routes before validating their payload", async () => {
    const response = await postJson("/api/team/assistant", {
      coopId: "",
      email: "not-an-email",
      password: "",
    });

    expect(response.status).toBe(401);
    expect(accountsService.createAssistant).not.toHaveBeenCalled();
  });

  it("rejects an invalid InstantDB session before saving a secret", async () => {
    instantAdmin.verifyToken.mockRejectedValueOnce(new Error("invalid token"));

    const response = await postJson(
      "/api/secrets/papi-key",
      { coopId: "coop-1", papiApiKey: "test-papi-key" },
      "Bearer invalid-test-token",
    );

    expect(response.status).toBe(401);
    expect(secretsService.savePapiKey).not.toHaveBeenCalled();
  });

  it("rejects a verified user without an active tenant membership", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "outsider", isPlatformAdmin: false }],
      memberships: [],
    });

    const response = await postJson(
      "/api/team/assistant",
      {
        coopId: "other-coop",
        email: "assistant@example.test",
        password: "secret-123",
      },
      bearer,
    );

    expect(response.status).toBe(403);
    expect(accountsService.createAssistant).not.toHaveBeenCalled();
  });

  it("rejects a disabled membership even when it carries the required permission", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "disabled-user", isPlatformAdmin: false }],
      memberships: [
        membership({ status: "disabled", role: "assistant", permissions: ["team"] }),
      ],
    });

    const response = await postJson(
      "/api/team/assistant",
      {
        coopId: "coop-1",
        email: "assistant@example.test",
        password: "secret-123",
      },
      bearer,
    );

    expect(response.status).toBe(403);
    expect(accountsService.createAssistant).not.toHaveBeenCalled();
  });

  it("rejects an assistant from team management even with the team permission", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "assistant-user", isPlatformAdmin: false }],
      memberships: [membership({ role: "assistant", permissions: ["team"] })],
    });

    const response = await postJson(
      "/api/team/assistant",
      {
        coopId: "coop-1",
        email: "assistant@example.test",
        password: "secret-123",
      },
      bearer,
    );

    expect(response.status).toBe(403);
    expect(accountsService.createAssistant).not.toHaveBeenCalled();
  });

  it("rejects an assistant update before the mutation service", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "assistant-user", isPlatformAdmin: false }],
      memberships: [membership({ role: "assistant", permissions: ["team"] })],
    });

    const response = await requestJson(
      "PATCH",
      "/api/team/assistant",
      {
        coopId: "coop-1",
        membershipId: "assistant-membership",
        permissions: ["bookings"],
      },
      bearer,
    );

    expect(response.status).toBe(403);
    expect(accountsService.updateAssistant).not.toHaveBeenCalled();
  });

  it("keeps subscription initiation owner-only", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "assistant-user", isPlatformAdmin: false }],
      memberships: [membership({ role: "assistant", permissions: ["settings"] })],
    });

    const response = await postJson(
      "/api/subscription/initiate",
      { coopId: "coop-1", planId: "plan-1" },
      bearer,
    );

    expect(response.status).toBe(403);
    expect(subscriptionService.initiateSubscriptionPayment).not.toHaveBeenCalled();
  });

  it("allows a platform admin to mutate any cooperative", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "platform-admin", isPlatformAdmin: true }],
      memberships: [],
    });
    secretsService.savePapiKey.mockResolvedValueOnce(undefined);

    const response = await postJson(
      "/api/secrets/papi-key",
      { coopId: "other-coop", papiApiKey: "test-papi-key" },
      bearer,
    );

    expect(response.status).toBe(200);
    expect(secretsService.savePapiKey).toHaveBeenCalledWith(
      "other-coop",
      "test-papi-key",
      undefined,
    );
  });

  it("keeps the subscription webhook public", async () => {
    subscriptionService.handleSubscriptionWebhook.mockResolvedValueOnce(undefined);
    const payload = {
      paymentStatus: "SUCCESS",
      merchantPaymentReference: "SUB-TEST-1234",
      notificationToken: "test-notification-token",
    };

    const response = await postJson("/api/subscription/webhook", payload);

    expect(response.status).toBe(200);
    expect(subscriptionService.handleSubscriptionWebhook).toHaveBeenCalledWith(payload);
    expect(instantAdmin.verifyToken).not.toHaveBeenCalled();
  });
});
