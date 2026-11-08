import { createHash, randomUUID } from "node:crypto";
import { adminDb, id } from "@cp/instant/admin";
import { HttpError } from "../errors";

type Seat = { label: string; passengerName: string };
export type BookingInput = {
  instanceId: string; tripVehicleId?: string | null; holdIds: string[];
  seats: Seat[]; contactName: string; contactPhone: string; contactEmail?: string;
  method: "cash" | "mobile_money"; source: "mobile" | "customer";
};

export async function loadSlot(instanceId: string, tripVehicleId?: string | null) {
  const { tripInstances } = await adminDb.query({ tripInstances: {
    $: { where: { id: instanceId } }, cooperative: {}, vehicles: { model: {} },
  } });
  const trip = tripInstances[0];
  if (!trip || trip.deletedAt || trip.status !== "scheduled" || +new Date(trip.departureAt) <= Date.now())
    throw new HttpError(409, "Ce départ n'est plus réservable.");
  if (!trip.cooperative || trip.cooperative.subscriptionStatus === "suspended")
    throw new HttpError(409, "Coopérative indisponible.");
  const slot = tripVehicleId ? trip.vehicles.find(v => v.id === tripVehicleId && !v.deletedAt) : trip;
  if (!slot || (!tripVehicleId && trip.vehicles.some(v => !v.deletedAt)))
    throw new HttpError(400, "Véhicule invalide.");
  return { trip, slot };
}

export async function holdSeats(userId: string, input: { instanceId: string; tripVehicleId?: string | null; labels: string[] }) {
  const { trip, slot } = await loadSlot(input.instanceId, input.tripVehicleId);
  let layout: any = slot.seatMapSnapshot;
  if (typeof layout === "string") { try { layout = JSON.parse(layout); } catch { layout = []; } }
  layout = Array.isArray(layout) ? layout : layout?.layout;
  if (!Array.isArray(layout) || !layout.length) layout = Array.from({ length: slot.seatsTotal }, (_, i) => ({ type: "seat", label: String(i + 1) }));
  const labels = new Set(layout.filter((c: any) => c.type === "seat").map((c: any) => c.label));
  if (input.labels.some(label => !labels.has(label))) throw new HttpError(400, "Siège invalide.");
  const now = Date.now();
  const expiresAt = now + 5 * 60_000;
  const chunks: any[] = [];
  const seats = [];
  for (const label of input.labels) {
    const seatKey = `${slot.id}_${label}`;
    const { seatHolds, tickets } = await adminDb.query({
      seatHolds: { $: { where: { seatKey } }, user: {} }, tickets: { $: { where: { seatKey } } },
    });
    if (tickets.length || seatHolds.some(h => +new Date(h.expiresAt) > now && h.user?.id !== userId))
      throw new HttpError(409, "Un siège vient d'être réservé.");
    for (const h of seatHolds) chunks.push(adminDb.tx.seatHolds[h.id].delete());
    const holdId = id();
    chunks.push(adminDb.tx.seatHolds[holdId].update({ seatKey, seatLabel: label, sessionToken: userId, expiresAt, createdAt: now })
      .link({ tripInstance: trip.id, cooperative: trip.cooperative!.id, user: userId, ...(input.tripVehicleId ? { tripVehicle: slot.id } : {}) }));
    seats.push({ holdId, seatLabel: label, seatKey });
  }
  await adminDb.transact(chunks);
  return { seats, expiresAt };
}

export async function createBooking(userId: string, input: BookingInput) {
  const { trip, slot } = await loadSlot(input.instanceId, input.tripVehicleId);
  const accepted = trip.cooperative!.paymentMethods as string[] | undefined;
  if (accepted?.length && !accepted.includes(input.method)) throw new HttpError(400, "Paiement non accepté.");
  if (!Number.isSafeInteger(trip.price) || trip.price < 0) throw new HttpError(409, "Tarif invalide.");
  const reservationKey = createHash("sha256").update([...input.holdIds].sort().join("_")).digest("hex");
  const { bookings } = await adminDb.query({ bookings: { $: { where: { reservationKey } }, customer: {} } });
  if (bookings[0]) {
    if (bookings[0].customer?.id !== userId || bookings[0].status !== "pending") throw new HttpError(409, "Sélection déjà utilisée.");
    return { bookingId: bookings[0].id, reference: bookings[0].reference };
  }
  const now = Date.now();
  const { seatHolds } = await adminDb.query({ seatHolds: { $: { where: { id: { $in: input.holdIds } } }, user: {} } });
  if (input.seats.length !== input.holdIds.length || input.seats.some(s => !seatHolds.some(h =>
    h.user?.id === userId && h.seatKey === `${slot.id}_${s.label}` && +new Date(h.expiresAt) > now)))
    throw new HttpError(409, "Votre sélection a expiré. Choisissez à nouveau vos sièges.");
  if (!Number.isSafeInteger(trip.price * input.seats.length)) throw new HttpError(400, "Montant invalide.");
  const bookingId = id();
  const reference = `CP-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  const seatMeta = input.seats.map(s => ({ ...s, price: trip.price }));
  const holdExpiresAt = now + 30 * 60_000;
  const links = { tripInstance: trip.id, cooperative: trip.cooperative!.id, customer: userId };
  const chunks: any[] = [adminDb.tx.bookings[bookingId].update({
    reservationKey, reference, source: input.source, contactName: input.contactName, contactPhone: input.contactPhone,
    ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
    seatCount: input.seats.length, totalAmount: trip.price * input.seats.length, currency: trip.currency,
    status: "pending", createdAt: now, holdExpiresAt, seatMeta, holdIds: input.holdIds,
    ...(input.tripVehicleId ? { tripVehicleId: input.tripVehicleId } : {}),
  }).link(links)];
  if (input.method === "mobile_money") {
    for (const h of seatHolds) chunks.push(adminDb.tx.seatHolds[h.id].update({ expiresAt: holdExpiresAt }));
  } else {
    for (const seat of seatMeta) chunks.push(adminDb.tx.tickets[id()].update({
      seatKey: `${slot.id}_${seat.label}`, seatLabel: seat.label, passengerName: seat.passengerName,
      price: seat.price, qrToken: randomUUID(), createdAt: now,
    }).link({ booking: bookingId, tripInstance: trip.id, cooperative: trip.cooperative!.id,
      ...(input.tripVehicleId ? { tripVehicle: input.tripVehicleId } : {}) }));
    for (const h of seatHolds) chunks.push(adminDb.tx.seatHolds[h.id].delete());
    chunks.push(adminDb.tx.payments[id()].update({ method: "cash", provider: "manual", amount: trip.price * input.seats.length,
      currency: trip.currency, status: "pending", createdAt: now }).link({ booking: bookingId, cooperative: trip.cooperative!.id }));
  }
  await adminDb.transact(chunks);
  return { bookingId, reference };
}
