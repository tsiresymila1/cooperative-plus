import { beforeEach, describe, expect, it, vi } from "vitest";

const authService = vi.hoisted(() => ({ passwordSignIn: vi.fn() }));
const instantAdmin = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  query: vi.fn(),
}));
const cooperativeService = vi.hoisted(() => ({
  createCooperative: vi.fn(),
  createCoopAccount: vi.fn(),
  purgeCooperative: vi.fn(),
  deleteCooperative: vi.fn(),
}));

vi.mock("@cp/instant/admin", () => ({
  adminDb: {
    auth: { verifyToken: instantAdmin.verifyToken },
    query: instantAdmin.query,
  },
}));
vi.mock("./services/auth", () => authService);
vi.mock("./services/cooperatives", () => cooperativeService);

import { HttpError } from "./errors";
import { app } from "./router";

const postJson = (path: string, body: unknown, authorization?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authorization) headers.Authorization = authorization;
  return app.request(`https://admin.test.invalid${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

const bearer = "Bearer test-admin-refresh-token";

describe("admin HTTP router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instantAdmin.verifyToken.mockResolvedValue({ id: "admin-user" });
    instantAdmin.query.mockResolvedValue({
      $users: [{ id: "admin-user", isPlatformAdmin: true }],
    });
  });

  it("validates and forwards admin credentials", async () => {
    authService.passwordSignIn.mockResolvedValueOnce({ token: "test-admin-token" });

    const response = await postJson("/api/auth/password", {
      email: "admin@example.test",
      password: "correct-horse",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ token: "test-admin-token" });
    expect(authService.passwordSignIn).toHaveBeenCalledWith(
      "admin@example.test",
      "correct-horse",
    );
    expect(instantAdmin.verifyToken).not.toHaveBeenCalled();
  });

  it("rejects malformed credentials before the auth service", async () => {
    const response = await postJson("/api/auth/password", {
      email: "admin-at-example.test",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(authService.passwordSignIn).not.toHaveBeenCalled();
  });

  it("maps invalid credentials to the unauthorized JSON contract", async () => {
    authService.passwordSignIn.mockRejectedValueOnce(
      new HttpError(401, "Identifiants invalides."),
    );

    const response = await postJson("/api/auth/password", {
      email: "admin@example.test",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Identifiants invalides." });
  });

  it("validates a cooperative before forwarding it to the service", async () => {
    cooperativeService.createCooperative.mockResolvedValueOnce({ ok: true, coopId: "coop-1" });
    const payload = {
      slug: "taxi-brousse",
      displayName: "Taxi Brousse",
      legalName: "Taxi Brousse SARL",
      ownerEmail: "owner@example.test",
      ownerPassword: "secret-123",
    };

    const response = await postJson("/api/cooperatives", payload, bearer);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, coopId: "coop-1" });
    expect(instantAdmin.verifyToken).toHaveBeenCalledWith("test-admin-refresh-token");
    expect(cooperativeService.createCooperative).toHaveBeenCalledWith(payload);
  });

  it("authenticates protected routes before validating their payload", async () => {
    const response = await postJson("/api/cooperatives", {
      slug: "",
      displayName: "",
      legalName: "",
    });

    expect(response.status).toBe(401);
    expect(cooperativeService.createCooperative).not.toHaveBeenCalled();
  });

  it("forwards a valid account request with its defaultable role", async () => {
    cooperativeService.createCoopAccount.mockResolvedValueOnce({ ok: true });
    const payload = {
      coopId: "coop-1",
      email: "assistant@example.test",
      password: "secret-123",
      role: "assistant",
    };

    const response = await postJson("/api/cooperatives/account", payload, bearer);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(cooperativeService.createCoopAccount).toHaveBeenCalledWith(payload);
  });

  it("rejects a missing bearer session before an admin mutation", async () => {
    const response = await postJson("/api/cooperatives", {
      slug: "blocked-coop",
      displayName: "Blocked Coop",
      legalName: "Blocked Coop SARL",
    });

    expect(response.status).toBe(401);
    expect(instantAdmin.verifyToken).not.toHaveBeenCalled();
    expect(cooperativeService.createCooperative).not.toHaveBeenCalled();
  });

  it("rejects an invalid InstantDB session before an admin mutation", async () => {
    instantAdmin.verifyToken.mockRejectedValueOnce(new Error("invalid token"));

    const response = await postJson(
      "/api/cooperatives/account",
      {
        coopId: "coop-1",
        email: "assistant@example.test",
        password: "secret-123",
      },
      "Bearer invalid-test-token",
    );

    expect(response.status).toBe(401);
    expect(cooperativeService.createCoopAccount).not.toHaveBeenCalled();
  });

  it("rejects a verified non-admin before an admin mutation", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      $users: [{ id: "regular-user", isPlatformAdmin: false }],
    });

    const response = await postJson(
      "/api/cooperatives/purge",
      { coopId: "coop-1" },
      bearer,
    );

    expect(response.status).toBe(403);
    expect(cooperativeService.purgeCooperative).not.toHaveBeenCalled();
  });

  it.each([
    ["purge", cooperativeService.purgeCooperative],
    ["delete", cooperativeService.deleteCooperative],
  ])("requires a cooperative id for %s operations", async (operation, service) => {
    const response = await postJson(`/api/cooperatives/${operation}`, { coopId: "" }, bearer);

    expect(response.status).toBe(400);
    expect(service).not.toHaveBeenCalled();
  });
});
