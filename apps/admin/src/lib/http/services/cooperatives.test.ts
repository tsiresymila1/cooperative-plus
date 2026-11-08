import { beforeEach, expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ query: vi.fn(), transact: vi.fn(), tx: new Proxy({}, {
  get: (_, namespace) => new Proxy({}, { get: (_, id) => ({ delete: () => ({ namespace, id }) }) }),
}) }));
vi.mock("@cp/instant/admin", () => ({ adminDb: store, id: () => "new-id" }));
import { deleteCooperative, purgeCooperative } from "./cooperatives";
beforeEach(() => vi.resetAllMocks());
it("purges holds using the seatHolds entity and removes departure vehicles", async () => {
  store.query.mockResolvedValue({ cooperatives: [{ id: "coop", holds: [{ id: "hold" }],
    tripInstances: [{ id: "trip", vehicles: [{ id: "slot" }] }] }] });
  await purgeCooperative("coop");
  const chunks = store.transact.mock.calls[0][0];
  expect(chunks).toContainEqual({ namespace: "seatHolds", id: "hold" });
  expect(chunks).toContainEqual({ namespace: "tripVehicles", id: "slot" });
});
it("deletes cooperative data without deleting shared user credentials", async () => {
  store.query.mockResolvedValue({ cooperatives: [{ id: "coop", members: [{ id: "membership", user: { email: "shared@example.test" } }],
    drivers: [{ id: "driver" }], vehicleModels: [{ id: "model" }], secrets: { id: "secret" } }] });
  await deleteCooperative("coop");
  const chunks = store.transact.mock.calls[0][0];
  expect(chunks).toContainEqual({ namespace: "memberships", id: "membership" });
  expect(chunks).toContainEqual({ namespace: "drivers", id: "driver" });
  expect(chunks).toContainEqual({ namespace: "vehicleModels", id: "model" });
  expect(chunks).toContainEqual({ namespace: "coopSecrets", id: "secret" });
  expect(chunks.some((c: any) => c.namespace === "credentials" || c.namespace === "$users")).toBe(false);
  expect(store.query).toHaveBeenCalledOnce();
});
