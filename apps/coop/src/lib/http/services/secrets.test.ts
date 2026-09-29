import { beforeEach, describe, expect, it, vi } from "vitest";

const cryptoService = vi.hoisted(() => ({ encrypt: vi.fn() }));
const instantAdmin = vi.hoisted(() => {
  const update = vi.fn();

  return {
    query: vi.fn(),
    transact: vi.fn(),
    update,
    tx: {
      coopSecrets: new Proxy(
        {},
        {
          get: (_target, id) => ({
            update: (data: unknown) => {
              update(String(id), data);
              return {
                link: (links: unknown) => ({ id: String(id), data, links }),
              };
            },
          }),
        },
      ),
    },
  };
});

vi.mock("@cp/crypto", () => ({ encrypt: cryptoService.encrypt }));
vi.mock("@cp/instant/admin", () => ({
  adminDb: {
    query: instantAdmin.query,
    transact: instantAdmin.transact,
    tx: instantAdmin.tx,
  },
}));

import { savePapiKey } from "./secrets";

describe("cooperative PAPI secret ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cryptoService.encrypt.mockReturnValue("test-encrypted-value");
  });

  it("rejects a supplied secret id owned by another cooperative before encryption", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      cooperatives: [{ id: "coop-1", secrets: { id: "coop-1-secret" } }],
    });

    await expect(
      savePapiKey("coop-1", "test-plain-key", "other-coop-secret"),
    ).rejects.toMatchObject({
      status: 403,
      message: "Ce secret n'appartient pas à cette coopérative.",
    });
    expect(cryptoService.encrypt).not.toHaveBeenCalled();
    expect(instantAdmin.update).not.toHaveBeenCalled();
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("safely reuses the cooperative's own secret when its id is supplied", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      cooperatives: [{ id: "coop-1", secrets: { id: "coop-1-secret" } }],
    });

    await expect(
      savePapiKey("coop-1", "test-plain-key", "coop-1-secret"),
    ).resolves.toBeUndefined();

    expect(cryptoService.encrypt).toHaveBeenCalledWith("test-plain-key");
    expect(instantAdmin.transact).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "coop-1-secret",
        data: expect.objectContaining({ papiApiKey: "test-encrypted-value" }),
        links: { cooperative: "coop-1" },
      }),
    );
  });

  it("reuses the cooperative's persisted secret even when the client omits its id", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      cooperatives: [{ id: "coop-1", secrets: { id: "coop-1-secret" } }],
    });

    await savePapiKey("coop-1", "test-plain-key");

    expect(instantAdmin.transact).toHaveBeenCalledWith(
      expect.objectContaining({ id: "coop-1-secret" }),
    );
  });
});
