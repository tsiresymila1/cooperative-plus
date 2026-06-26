// Trip-vehicle "slots". A trip has 1..N vehicles; seats live per slot.
// Backward-compatible: trips created before Phase 2 have no tripVehicles rows,
// so we synthesize ONE virtual slot whose id IS the tripId → its seatKey stays
// `${tripId}_${seat}` (matches existing tickets/holds, no mixed-format clash).

export type Slot = {
  id: string;
  label: string;
  seatMapSnapshot: any;
  seatsTotal: number;
  seatsBooked?: number;
  vehicleName?: string | null;
  registrationNo?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  model?: any;
  vehicle?: any;
  driver?: any;
  tickets?: any[];
  holds?: any[];
  isVirtual: boolean;
};

/** Resolve a trip's vehicle slots (real rows, else one virtual slot = the trip). */
export function tripSlots(trip: any): Slot[] {
  const real = (trip?.vehicles ?? []).filter((v: any) => !v.deletedAt);
  if (real.length) {
    return [...real]
      .sort((a: any, b: any) => String(a.label ?? "").localeCompare(String(b.label ?? "")))
      .map((v: any) => ({ ...v, isVirtual: false }));
  }
  if (!trip) return [];
  return [{
    id: trip.id,
    label: trip.vehicleName ?? "Véhicule",
    seatMapSnapshot: trip.seatMapSnapshot,
    seatsTotal: trip.seatsTotal ?? 0,
    vehicleName: trip.vehicleName,
    driverName: trip.driverName,
    driverPhone: trip.driverPhone,
    driver: trip.driver,
    vehicle: trip.vehicle,
    tickets: trip.tickets,
    holds: trip.holds,
    isVirtual: true,
  }];
}

export const slotSeatKey = (slotId: string, label: string) => `${slotId}_${label}`;

const DEAD = ["cancelled", "expired", "refunded"];

/** Seats taken on a slot = live-booking tickets + unexpired holds (labels). */
export function slotTakenLabels(slot: Slot, nowMs = Date.now()): string[] {
  const taken = (slot.tickets ?? [])
    .filter((t: any) => !DEAD.includes(t.booking?.status))
    .map((t: any) => t.seatLabel);
  const held = (slot.holds ?? [])
    .filter((h: any) => +new Date(h.expiresAt) > nowMs)
    .map((h: any) => h.seatLabel);
  return [...taken, ...held];
}

/** Total seats + available across all slots of a trip. */
export function tripCapacity(trip: any, nowMs = Date.now()): { total: number; avail: number } {
  const slots = tripSlots(trip);
  let total = 0, taken = 0;
  for (const s of slots) {
    total += s.seatsTotal ?? 0;
    taken += new Set(slotTakenLabels(s, nowMs)).size;
  }
  return { total, avail: Math.max(0, total - taken) };
}
