import { beforeEach, describe, expect, it, vi } from "vitest";

const password = vi.hoisted(() => ({ hashPassword: vi.fn() }));
const instantAdmin = vi.hoisted(() => {
  const operation = (namespace: string, id: PropertyKey) => ({
    update: (data: unknown) => ({
      namespace,
      id: String(id),
      data,
      link: (links: unknown) => ({ namespace, id: String(id), data, links }),
    }),
    delete: () => ({ namespace, id: String(id), action: "delete" }),
  });

  return {
    query: vi.fn(),
    transact: vi.fn(),
    createToken: vi.fn(),
    newId: vi.fn(),
    tx: {
      $users: new Proxy({}, { get: (_target, id) => operation("$users", id) }),
      credentials: new Proxy({}, { get: (_target, id) => operation("credentials", id) }),
      memberships: new Proxy({}, { get: (_target, id) => operation("memberships", id) }),
    },
  };
});

vi.mock("@cp/instant/password", () => ({ hashPassword: password.hashPassword }));
vi.mock("@cp/instant/admin", () => ({
  adminDb: {
    query: instantAdmin.query,
    transact: instantAdmin.transact,
    auth: { createToken: instantAdmin.createToken },
    tx: instantAdmin.tx,
  },
  id: instantAdmin.newId,
}));

import { createAssistant, deleteAssistant, updateAssistant } from "./accounts";

const input = {
  coopId: "coop-1",
  email: " New.Assistant@Example.Test ",
  password: "secret-123",
  permissions: ["bookings"],
};

describe("assistant identity creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    password.hashPassword.mockReturnValue("test-password-hash");
  });

  it("rejects an existing user, including a platform-admin identity, without side effects", async () => {
    instantAdmin.query
      .mockResolvedValueOnce({ cooperatives: [{ id: "coop-1" }] })
      .mockResolvedValueOnce({
        $users: [
          {
            id: "platform-admin",
            email: "new.assistant@example.test",
            isPlatformAdmin: true,
          },
        ],
        credentials: [],
      });

    await expect(createAssistant(input)).rejects.toMatchObject({
      status: 409,
      message: "Un compte existe déjà avec cet email.",
    });
    expect(instantAdmin.createToken).not.toHaveBeenCalled();
    expect(password.hashPassword).not.toHaveBeenCalled();
    expect(instantAdmin.newId).not.toHaveBeenCalled();
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects an existing credential even if its user record is unavailable", async () => {
    instantAdmin.query
      .mockResolvedValueOnce({ cooperatives: [{ id: "coop-1" }] })
      .mockResolvedValueOnce({
        $users: [],
        credentials: [{ id: "credential-1", email: "new.assistant@example.test" }],
      });

    await expect(createAssistant(input)).rejects.toMatchObject({ status: 409 });
    expect(instantAdmin.createToken).not.toHaveBeenCalled();
    expect(password.hashPassword).not.toHaveBeenCalled();
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("re-attaches a removed assistant without replacing the existing password", async () => {
    instantAdmin.query
      .mockResolvedValueOnce({ cooperatives: [{ id: "coop-1" }] })
      .mockResolvedValueOnce({
        $users: [{ id: "existing-assistant", email: "new.assistant@example.test" }],
        credentials: [{ id: "existing-credential", email: "new.assistant@example.test" }],
      })
      .mockResolvedValueOnce({ memberships: [] });
    instantAdmin.newId.mockReturnValueOnce("replacement-membership-id");

    await expect(createAssistant(input)).resolves.toEqual({ ok: true });

    expect(instantAdmin.createToken).not.toHaveBeenCalled();
    expect(password.hashPassword).not.toHaveBeenCalled();
    expect(instantAdmin.newId).toHaveBeenCalledTimes(1);
    expect(instantAdmin.transact).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "memberships",
        id: "replacement-membership-id",
        data: expect.objectContaining({ role: "assistant", status: "active" }),
        links: { cooperative: "coop-1", user: "existing-assistant" },
      }),
    );
  });

  it("uses fresh credential and membership ids for a new assistant", async () => {
    instantAdmin.query
      .mockResolvedValueOnce({ cooperatives: [{ id: "coop-1" }] })
      .mockResolvedValueOnce({ $users: [], credentials: [] })
      .mockResolvedValueOnce({
        $users: [{ id: "new-user", email: "new.assistant@example.test" }],
      });
    instantAdmin.createToken.mockResolvedValueOnce("test-refresh-token");
    instantAdmin.newId
      .mockReturnValueOnce("new-credential-id")
      .mockReturnValueOnce("new-membership-id");

    await expect(createAssistant(input)).resolves.toEqual({ ok: true });

    expect(instantAdmin.createToken).toHaveBeenCalledWith("new.assistant@example.test");
    expect(instantAdmin.newId).toHaveBeenCalledTimes(2);
    expect(instantAdmin.transact).toHaveBeenCalledWith([
      expect.objectContaining({
        namespace: "credentials",
        id: "new-credential-id",
        data: expect.objectContaining({
          email: "new.assistant@example.test",
          passwordHash: "test-password-hash",
        }),
      }),
      expect.objectContaining({
        namespace: "memberships",
        id: "new-membership-id",
        data: expect.objectContaining({
          role: "assistant",
          status: "active",
          permissions: ["bookings"],
        }),
        links: { cooperative: "coop-1", user: "new-user" },
      }),
    ]);
  });
});

describe("assistant membership management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an assistant membership from another cooperative before mutation", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      memberships: [
        {
          id: "membership-1",
          role: "assistant",
          cooperative: { id: "other-coop" },
        },
      ],
    });

    await expect(
      updateAssistant({
        coopId: "coop-1",
        membershipId: "membership-1",
        status: "disabled",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("refuses to delete an owner membership before mutation", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      memberships: [
        {
          id: "owner-membership",
          role: "owner",
          cooperative: { id: "coop-1" },
        },
      ],
    });

    await expect(
      deleteAssistant({ coopId: "coop-1", membershipId: "owner-membership" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("updates only the requested fields on an owned assistant membership", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      memberships: [
        {
          id: "assistant-membership",
          role: "assistant",
          cooperative: { id: "coop-1" },
        },
      ],
    });

    await expect(
      updateAssistant({
        coopId: "coop-1",
        membershipId: "assistant-membership",
        permissions: ["bookings", "team"],
      }),
    ).resolves.toEqual({ ok: true });
    expect(instantAdmin.transact).toHaveBeenCalledWith({
      namespace: "memberships",
      id: "assistant-membership",
      data: { permissions: ["bookings", "team"] },
      link: expect.any(Function),
    });
  });

  it("deletes an owned assistant membership", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      memberships: [
        {
          id: "assistant-membership",
          role: "assistant",
          cooperative: { id: "coop-1" },
        },
      ],
    });

    await expect(
      deleteAssistant({ coopId: "coop-1", membershipId: "assistant-membership" }),
    ).resolves.toEqual({ ok: true });
    expect(instantAdmin.transact).toHaveBeenCalledWith({
      namespace: "memberships",
      id: "assistant-membership",
      action: "delete",
    });
  });
});
