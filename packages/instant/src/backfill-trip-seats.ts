// One-off: make every existing tripInstance/tripVehicle's seatsTotal +
// seatMapSnapshot match the vehicleModel actually linked to it (via the
// vehicle, or the tripVehicle's own model link), instead of whatever was
// hand-picked/invented at creation time. Skips a slot when the model has no
// usable layout, or when doing so would strand an already-booked/held seat
// (seat label not present in the new layout) — those are logged, not
// silently overwritten.
//   pnpm --filter @cp/instant exec tsx src/backfill-trip-seats.ts
import { adminDb } from "./admin";

const DEAD = ["cancelled", "expired", "refunded"];
const seatLabelsOf = (layout: any): string[] =>
  Array.isArray(layout) ? layout.filter((c: any) => c.type === "seat").map((c: any) => String(c.label)) : [];

function resolveModel(m: any): any | undefined {
  return m && Array.isArray(m.layout) && m.layout.length ? m : undefined;
}

async function main() {
  const { tripInstances } = await adminDb.query({
    tripInstances: {
      vehicle: { model: {} },
      vehicles: { model: {}, vehicle: { model: {} }, tickets: { booking: {} }, holds: {} },
      tickets: { booking: {} },
      holds: {},
    },
  });

  const chunks: any[] = [];
  let updatedSlots = 0, updatedInstances = 0, skippedNoModel = 0, skippedRisk = 0;

  for (const trip of tripInstances ?? []) {
    const t = trip as any;
    const slots: { tripVehicleId?: string; model: any; current: { seatsTotal: number; seatMapSnapshot: any }; occupied: string[] }[] = [];

    if (Array.isArray(t.vehicles) && t.vehicles.length) {
      for (const tv of t.vehicles) {
        const model = resolveModel(tv.model) ?? resolveModel(tv.vehicle?.model);
        const occupied = [
          ...(tv.tickets ?? []).filter((tk: any) => !DEAD.includes(tk.booking?.status)).map((tk: any) => tk.seatLabel),
          ...(tv.holds ?? []).filter((h: any) => +new Date(h.expiresAt) > Date.now()).map((h: any) => h.seatLabel),
        ];
        slots.push({ tripVehicleId: tv.id, model, current: { seatsTotal: tv.seatsTotal, seatMapSnapshot: tv.seatMapSnapshot }, occupied });
      }
    } else {
      // Legacy trip: no tripVehicles rows yet, seats live directly on tripInstances.
      const model = resolveModel(t.vehicle?.model);
      const occupied = [
        ...(t.tickets ?? []).filter((tk: any) => !DEAD.includes(tk.booking?.status)).map((tk: any) => tk.seatLabel),
        ...(t.holds ?? []).filter((h: any) => +new Date(h.expiresAt) > Date.now()).map((h: any) => h.seatLabel),
      ];
      slots.push({ tripVehicleId: undefined, model, current: { seatsTotal: t.seatsTotal, seatMapSnapshot: t.seatMapSnapshot }, occupied });
    }

    let anySlotChanged = false;
    const newSlotSeats: { seatsTotal: number; seatMapSnapshot: any }[] = [];

    for (const slot of slots) {
      if (!slot.model) { skippedNoModel++; newSlotSeats.push(slot.current); continue; }
      const targetLayout = slot.model.layout;
      const targetSeats = seatLabelsOf(targetLayout).length;
      const already = JSON.stringify(slot.current.seatMapSnapshot) === JSON.stringify(targetLayout) && slot.current.seatsTotal === targetSeats;
      if (already) { newSlotSeats.push(slot.current); continue; }

      const newLabels = new Set(seatLabelsOf(targetLayout));
      const stranded = slot.occupied.filter((l) => !newLabels.has(l));
      if (stranded.length) {
        console.warn(`skip trip ${t.id}${slot.tripVehicleId ? ` slot ${slot.tripVehicleId}` : ""}: model would strand booked/held seat(s) ${stranded.join(", ")}`);
        skippedRisk++;
        newSlotSeats.push(slot.current);
        continue;
      }

      const updated = { seatsTotal: targetSeats, seatMapSnapshot: targetLayout };
      newSlotSeats.push(updated);
      anySlotChanged = true;
      if (slot.tripVehicleId) {
        chunks.push(adminDb.tx.tripVehicles[slot.tripVehicleId]!.update(updated));
        updatedSlots++;
      }
    }

    if (!anySlotChanged) continue;

    // Trip-level mirror: single slot → its snapshot, multi-slot → cleared
    // (tripVehicles rows are the source of truth once there's more than one).
    const instanceSeatsTotal = newSlotSeats.reduce((s, x) => s + x.seatsTotal, 0);
    const instanceSnapshot = newSlotSeats.length === 1 ? newSlotSeats[0]!.seatMapSnapshot : [];
    chunks.push(adminDb.tx.tripInstances[t.id]!.update({ seatsTotal: instanceSeatsTotal, seatMapSnapshot: instanceSnapshot }));
    updatedInstances++;
  }

  for (let i = 0; i < chunks.length; i += 50) await adminDb.transact(chunks.slice(i, i + 50));

  console.log(`updated ${updatedInstances} tripInstances (${updatedSlots} tripVehicle slots); skipped ${skippedNoModel} (no model layout), ${skippedRisk} (would strand booked/held seats)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
