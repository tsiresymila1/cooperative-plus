import { adminDb, id as newId } from "@cp/instant/admin";
import { decrypt, isEncrypted } from "@cp/crypto";
import { HttpError } from "../errors";

const PAPI_URL = "https://app.papi.mg/dashboard/api/payment-links";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PAPI_FALLBACK_KEY = process.env.PAPI_API_KEY;
const TEST_MODE = process.env.PAPI_TEST_MODE === "true";

type SeatMeta = { label: string; passengerName: string; price: number };

type InitiateInput = {
  bookingReference: string;
  instanceId?: string;
  coopId?: string | null;
  holdIds?: string[];
  seatMeta?: SeatMeta[];
  tripVehicleId?: string | null;
};

export async function initiatePayment(input: InitiateInput): Promise<{ url: string }> {
  const { bookingReference, instanceId, coopId, holdIds = [], seatMeta = [], tripVehicleId = null } = input;

  const { bookings } = await adminDb.query({
    bookings: {
      $: { where: { reference: bookingReference } },
      cooperative: { secrets: {} },
      tripInstance: {},
    },
  });

  const booking = bookings?.[0];
  if (!booking) throw new HttpError(404, "Réservation introuvable");
  if (["confirmed", "paid"].includes(booking.status))
    throw new HttpError(409, "Réservation déjà payée");

  const resolvedInstanceId = instanceId ?? (booking as any).tripInstance?.id ?? "";
  const resolvedCoopId = coopId ?? (booking as any).cooperative?.id ?? null;

  const coop = (booking as any).cooperative;
  const rawKey = (coop?.secrets as any)?.papiApiKey ?? PAPI_FALLBACK_KEY;
const papiApiKey = rawKey && isEncrypted(rawKey) ? decrypt(rawKey) : rawKey;
  if (!papiApiKey)
    throw new HttpError(422, "Paiement en ligne non configuré pour cette coopérative");

  const papiRes = await fetch(PAPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Token: papiApiKey },
    body: JSON.stringify({
      amount: booking.totalAmount,
      clientName: booking.contactName,
      reference: bookingReference,
      description: `Réservation ${bookingReference}`,
      successUrl: `${APP_URL}/bookings/${bookingReference}?payment=success`,
      failureUrl: `${APP_URL}/bookings/${bookingReference}?payment=failed`,
      notificationUrl: `${APP_URL}/api/payment/webhook`,
      validDuration: 30,
      ...(booking.contactEmail ? { payerEmail: booking.contactEmail } : {}),
      ...(booking.contactPhone ? { payerPhone: booking.contactPhone } : {}),
      isTestMode: TEST_MODE,
      ...(TEST_MODE ? { testReason: "Tests internes" } : {}),
    }),
  });

  const papiData = await papiRes.json();

  if (!papiRes.ok || !papiData?.data?.paymentLink)
    throw new HttpError(502, papiData?.message ?? "Erreur PAPI");

  const paymentId = newId();
  await adminDb.transact(
    adminDb.tx.payments[paymentId]
      .update({
        method: "online",
        provider: "papi",
        amount: booking.totalAmount,
        currency: booking.currency,
        status: "pending",
        providerRef: bookingReference,
        meta: {
          testMode: TEST_MODE,
          notificationToken: papiData.data.notificationToken,
          // Stored for webhook to create tickets on SUCCESS (empty = tickets already exist)
          instanceId: resolvedInstanceId,
          coopId: resolvedCoopId,
          holdIds,
          seatMeta,
          tripVehicleId,
        },
        createdAt: Date.now(),
      })
      .link({ booking: booking.id, cooperative: coop.id }),
  );

  return { url: papiData.data.paymentLink };
}

type PapiWebhookPayload = {
  paymentStatus: string;
  paymentMethod?: string;
  currency?: string;
  amount?: number;
  fee?: number;
  clientName?: string;
  merchantPaymentReference?: string;
  paymentReference?: string;
  notificationToken?: string;
  payerEmail?: string;
  payerPhone?: string;
  message?: string | null;
};

export async function handleWebhook(body: PapiWebhookPayload): Promise<void> {
  const reference = body.merchantPaymentReference;
  const papiStatus = body.paymentStatus?.toUpperCase();
  const incomingToken = body.notificationToken;

  if (!reference || !papiStatus) throw new HttpError(400, "Payload invalide");

  const { bookings } = await adminDb.query({
    bookings: { $: { where: { reference } }, payments: {} },
  });

  const booking = bookings?.[0];
  if (!booking) throw new HttpError(404, "Réservation introuvable");

  const payment = (booking.payments ?? [])[0];

  // Idempotency — already in terminal state, skip
  if (payment?.status === "paid" || payment?.status === "failed") return;

  // Verify notificationToken to reject spoofed webhooks
  const storedToken = (payment?.meta as any)?.notificationToken;
  if (storedToken && incomingToken && storedToken !== incomingToken)
    throw new HttpError(401, "notificationToken invalide");

  const paymentStatus =
    papiStatus === "SUCCESS" ? "paid" : papiStatus === "FAILED" ? "failed" : "pending";
  const bookingStatus =
    papiStatus === "SUCCESS" ? "paid" : papiStatus === "FAILED" ? "pending" : booking.status;

  const chunks: any[] = [];

  if (payment) {
    chunks.push(
      adminDb.tx.payments[payment.id].update({
        status: paymentStatus,
        // Overwrite with exact amount PAPI confirms (catches rounding edge cases)
        ...(body.amount != null ? { amount: body.amount } : {}),
        ...(body.currency ? { currency: body.currency } : {}),
        // Store PAPI's own transaction reference for reconciliation
        ...(body.paymentReference ? { providerRef: body.paymentReference } : {}),
        ...(papiStatus === "SUCCESS" ? { paidAt: Date.now() } : {}),
        meta: {
          ...(payment.meta ?? {}),
          papiStatus: body.paymentStatus,
          paymentMethod: body.paymentMethod,
          fee: body.fee,
          payerEmail: body.payerEmail,
          payerPhone: body.payerPhone,
          papiMessage: body.message,
          merchantRef: reference,
        },
      }),
    );
  }

  // On SUCCESS: create tickets from stored seatMeta and delete holds
  if (papiStatus === "SUCCESS" && payment) {
    const meta = payment.meta as any;
    const seatMeta: SeatMeta[] = meta?.seatMeta ?? [];
    const holdIds: string[] = meta?.holdIds ?? [];
    const instanceId: string = meta?.instanceId ?? "";
    const coopId: string | null = meta?.coopId ?? null;
    const tripVehicleId: string | null = meta?.tripVehicleId ?? null;
    // Seat slot id: the tripVehicle (multi-vehicle trips) or the trip (legacy).
    const slotId = tripVehicleId || instanceId;

    for (const seat of seatMeta) {
      const ticketId = newId();
      chunks.push(
        adminDb.tx.tickets[ticketId]
          .update({
            seatKey: `${slotId}_${seat.label}`,
            seatLabel: seat.label,
            passengerName: seat.passengerName,
            price: seat.price,
            qrToken: newId(),
            createdAt: Date.now(),
          })
          .link({
            booking: booking.id,
            tripInstance: instanceId,
            ...(coopId ? { cooperative: coopId } : {}),
            ...(tripVehicleId ? { tripVehicle: tripVehicleId } : {}),
          }),
      );
    }

    for (const hid of holdIds) {
      chunks.push(adminDb.tx.seatHolds[hid].delete());
    }
  }

  chunks.push(adminDb.tx.bookings[booking.id].update({ status: bookingStatus }));
  await adminDb.transact(chunks);
}
