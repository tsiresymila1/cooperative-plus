import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => {
  const operation = (namespace: string, key: PropertyKey) => ({
    update: (data: unknown) => ({ namespace, id: String(key), data,
      link: (links: unknown) => ({ namespace, id: String(key), data, links }) }),
    delete: () => ({ namespace, id: String(key), deleted: true }),
  });
  return { query: vi.fn(), transact: vi.fn(), tx: new Proxy({}, { get: (_, ns) =>
    new Proxy({}, { get: (_, key) => operation(String(ns), key) }) }) };
});
vi.mock("@cp/instant/admin", () => ({ adminDb: store, id: () => crypto.randomUUID() }));
import { createBooking, holdSeats } from "./booking";

const trip = { id: "trip", status: "scheduled", departureAt: "2099-01-01", price: 25_000,
  currency: "MGA", seatsTotal: 2, seatMapSnapshot: [{ type: "seat", label: "1" }, { type: "seat", label: "2" }],
  cooperative: { id: "coop", subscriptionStatus: "active", paymentMethods: ["cash", "mobile_money"] }, vehicles: [] };
const input = { instanceId: "trip", holdIds: ["hold"], seats: [{ label: "1", passengerName: "Rider" }],
  contactName: "Rider", contactPhone: "0340000000", method: "cash" as const, source: "mobile" as const };

describe("server booking boundaries", () => {
  beforeEach(() => { vi.resetAllMocks(); store.transact.mockResolvedValue({}); });
  it("rejects a slot from a different departure", async () => {
    store.query.mockResolvedValue({ tripInstances: [trip] });
    await expect(holdSeats("user", { instanceId: "trip", tripVehicleId: "other", labels: ["1"] })).rejects.toMatchObject({ status: 400 });
    expect(store.transact).not.toHaveBeenCalled();
  });
  it("rejects a seat outside the seat map", async () => {
    store.query.mockResolvedValue({ tripInstances: [trip] });
    await expect(holdSeats("user", { instanceId: "trip", labels: ["999"] })).rejects.toMatchObject({ status: 400 });
  });
  it("does not delete another traveler's active hold", async () => {
    store.query.mockResolvedValueOnce({ tripInstances: [trip] }).mockResolvedValueOnce({
      seatHolds: [{ id: "other", expiresAt: Date.now() + 60_000, user: { id: "another-user" } }], tickets: [],
    });
    await expect(holdSeats("user", { instanceId: "trip", labels: ["1"] })).rejects.toMatchObject({ status: 409 });
    expect(store.transact).not.toHaveBeenCalled();
  });
  it("rejects a sold seat even when its hold no longer exists", async () => {
    store.query.mockResolvedValueOnce({ tripInstances: [trip] }).mockResolvedValueOnce({ seatHolds: [], tickets: [{ id: "sold" }] });
    await expect(holdSeats("user", { instanceId: "trip", labels: ["1"] })).rejects.toMatchObject({ status: 409 });
  });
  it("submits all selected holds in a single transaction", async () => {
    store.query.mockResolvedValue({ tripInstances: [trip], seatHolds: [], tickets: [] });
    const result = await holdSeats("user", { instanceId: "trip", labels: ["1", "2"] });
    expect(result.seats).toHaveLength(2);
    expect(store.transact).toHaveBeenCalledOnce();
    expect(store.transact.mock.calls[0][0]).toHaveLength(2);
  });
  it.each(["another-user", "user"])("rejects a foreign or expired hold (%s)", async owner => {
    store.query.mockResolvedValueOnce({ tripInstances: [trip] }).mockResolvedValueOnce({ bookings: [] }).mockResolvedValueOnce({ seatHolds: [{
      id: "hold", user: { id: owner }, seatKey: "trip_1", expiresAt: owner === "user" ? 0 : Date.now() + 60_000,
    }] });
    await expect(createBooking("user", input)).rejects.toMatchObject({ status: 409 });
    expect(store.transact).not.toHaveBeenCalled();
  });
  it("derives the amount from the stored fare and atomically issues cash tickets", async () => {
    store.query.mockResolvedValueOnce({ tripInstances: [trip] }).mockResolvedValueOnce({ bookings: [] }).mockResolvedValueOnce({ seatHolds: [{
      id: "hold", user: { id: "user" }, seatKey: "trip_1", expiresAt: Date.now() + 60_000,
    }] });
    await createBooking("user", { ...input, totalAmount: 1 } as typeof input);
    expect(store.transact).toHaveBeenCalledOnce();
    const chunks = store.transact.mock.calls[0][0];
    expect(chunks.find((c: any) => c.namespace === "bookings").data.totalAmount).toBe(25_000);
    expect(chunks.find((c: any) => c.namespace === "payments").data.status).toBe("pending");
    expect(chunks.some((c: any) => c.namespace === "tickets")).toBe(true);
  });
});
