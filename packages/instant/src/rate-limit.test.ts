import { beforeEach, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ query: vi.fn(), transact: vi.fn(), tx: {
  rateLimits: new Proxy({}, { get: (_, id) => ({ update: (data: unknown) => ({ id, data }), delete: () => ({ id, deleted: true }) }) }),
} }));
vi.mock("./admin", () => ({ adminDb: store, id: () => "new-slot" }));
import { cleanRateLimits, consumeRateLimit } from "./rate-limit";
beforeEach(() => vi.resetAllMocks());
it("allows an unused slot", async () => {
  store.query.mockResolvedValue({ rateLimits: [] });
  await expect(consumeRateLimit("user", "upload", 1, 0)).resolves.toBe(true);
  expect(store.transact).toHaveBeenCalledOnce();
});
it("refuses a slot concurrently claimed by another instance", async () => {
  store.query.mockResolvedValueOnce({ rateLimits: [] }).mockResolvedValueOnce({ rateLimits: [{ key: "collision" }] });
  store.transact.mockRejectedValue(new Error("unique constraint"));
  await expect(consumeRateLimit("user", "upload", 1, 0)).resolves.toBe(false);
});
it("does not hide database failures as rate limits", async () => {
  store.query.mockResolvedValue({ rateLimits: [] });
  store.transact.mockRejectedValue(new Error("database unavailable"));
  await expect(consumeRateLimit("user", "upload", 1, 0)).rejects.toThrow("database unavailable");
});

it("cleans expired rate-limit rows until no batch remains", async () => {
  store.query.mockResolvedValueOnce({ rateLimits: [{ id: "expired" }] }).mockResolvedValueOnce({ rateLimits: [] });
  await cleanRateLimits();
  expect(store.transact).toHaveBeenCalledWith([{ id: "expired", deleted: true }]);
  expect(store.query).toHaveBeenCalledTimes(2);
});
