import { adminDb, id as newId } from "@cp/instant/admin";
import { decrypt, hashSecret, isEncrypted, verifySecret } from "@cp/crypto";
import { HttpError } from "../errors";

const PAPI_URL = "https://app.papi.mg/dashboard/api/payment-links";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PAPI_FALLBACK_KEY = process.env.PAPI_API_KEY;
const TEST_MODE = process.env.PAPI_TEST_MODE === "true";

type SeatMeta = { label: string; passengerName: string; price: number; ticketId?: string };

type InitiateInput = { bookingReference: string; userId: string };

export async function initiatePayment(input: InitiateInput): Promise<{ url: string }> {
  const { bookingReference, userId } = input;
  const { bookings } = await adminDb.query({
    bookings: {
      $: { where: { reference: bookingReference } },
      cooperative: { secrets: {} },
      tripInstance: {}, customer: {}, tickets: {}, payments: {},
    },
  });

  const booking = bookings?.[0];
  if (!booking) throw new HttpError(404, "Réservation introuvable");
  if (booking.customer?.id !== userId) throw new HttpError(403, "Cette réservation ne vous appartient pas.");
  if (booking.status !== "pending") throw new HttpError(409, "Réservation non payable.");
  const instance = booking.tripInstance;
  if (!instance || !Number.isSafeInteger(instance.price) || instance.price < 0 ||
      booking.totalAmount !== instance.price * booking.seatCount || booking.currency !== instance.currency)
    throw new HttpError(409, "Le tarif doit être vérifié par la coopérative.");
  const resolvedInstanceId = instance.id;
  const resolvedCoopId = booking.cooperative?.id;
  const tripVehicleId = booking.tripVehicleId ?? null;
  const seatMeta = (booking.seatMeta ?? []) as SeatMeta[];
  const holdIds = (booking.holdIds ?? []) as string[];
  if (!booking.tickets.length && (!seatMeta.length || !booking.holdExpiresAt || +new Date(booking.holdExpiresAt) <= Date.now()))
    throw new HttpError(409, "Votre réservation a expiré.");
  const existing = booking.payments.find(p => p.status === "pending" && (p.meta as any)?.paymentUrl &&
    (p.meta as any)?.validUntil > Date.now());
  if (existing) return { url: (existing.meta as any).paymentUrl };
  const paymentId = newId();
  const merchantRef = `PAY-${paymentId.replaceAll("-", "").slice(0, 16)}`;
  const coop = (booking as any).cooperative;
  const rawKey = (coop?.secrets as any)?.papiApiKey ?? PAPI_FALLBACK_KEY;
  const papiApiKey = rawKey && isEncrypted(rawKey) ? decrypt(rawKey) : rawKey;
  if (!papiApiKey)
    throw new HttpError(422, "Paiement en ligne non configuré pour cette coopérative");


  const papiRes = await fetch(PAPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Token: papiApiKey },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      amount: booking.totalAmount,
      clientName: booking.contactName,
      reference: merchantRef,
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

  const notificationToken = papiData?.data?.notificationToken;
  if (
    !papiRes.ok ||
    !papiData?.data?.paymentLink ||
    typeof notificationToken !== "string" ||
    !notificationToken.trim()
  )
    throw new HttpError(502, papiData?.message ?? "Erreur PAPI");

  await adminDb.transact(
    adminDb.tx.payments[paymentId]
      .update({
        method: "online",
        provider: "papi",
        amount: booking.totalAmount,
        currency: booking.currency,
        status: "pending",
        providerRef: merchantRef,
        meta: {
          testMode: TEST_MODE,
          merchantRef, paymentUrl: papiData.data.paymentLink, validUntil: Date.now() + 30 * 60_000,
          notificationTokenHash: hashSecret(notificationToken),
          // Stored for webhook to create tickets on SUCCESS (empty = tickets already exist)
          instanceId: resolvedInstanceId,
          coopId: resolvedCoopId,
          holdIds,
          seatMeta: booking.tickets.length ? [] : seatMeta.map(s => ({ ...s, ticketId: newId() })),
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

  const { payments } = await adminDb.query({ payments: { $: { where: { providerRef: reference } }, booking: { tickets: {} } } });
  // Older payment links used the booking reference rather than a per-attempt reference.
  const legacy = payments.length ? [] : (await adminDb.query({ bookings: { $: { where: { reference } }, payments: {}, tickets: {} } })).bookings;
  const candidates = payments.length ? payments : (legacy[0]?.payments ?? []);
  const payment = candidates.find(p => {
    const hash = (p.meta as any)?.notificationTokenHash;
    return typeof hash === "string" && typeof incomingToken === "string" && verifySecret(incomingToken, hash);
  });
  if (!payment) throw new HttpError(401, "notificationToken invalide");
  const booking = (payment as any).booking ?? legacy[0];
  if (!booking) throw new HttpError(404, "Réservation introuvable");
  if (!["SUCCESS", "FAILED", "PENDING"].includes(papiStatus)) throw new HttpError(400, "Statut invalide");
  if (papiStatus === "SUCCESS" && ((body.amount != null && body.amount !== payment.amount) ||
      (body.currency != null && body.currency !== payment.currency)))
    throw new HttpError(409, "Montant ou devise du paiement incorrect.");
  // Idempotency — already in terminal state, skip only after authentication.
  if (payment?.status === "paid") return;

  const paymentStatus =
    papiStatus === "SUCCESS" ? "paid" : papiStatus === "FAILED" ? "failed" : "pending";
  const bookingStatus =
    papiStatus === "SUCCESS" ? "paid" : booking.status;

  if (papiStatus === "SUCCESS" && ["cancelled", "expired", "refunded", "paid", "confirmed"].includes(booking.status)) {
    await adminDb.transact([
      adminDb.tx.payments[payment.id].update({ status: "paid", paidAt: Date.now(), meta: { ...(payment.meta as any), allocationError: true } }),
      adminDb.tx.bookings[booking.id].update({ status: "payment_review" }),
    ]);
    return;
  }

  const chunks: any[] = [];

  if (payment) {
    chunks.push(
      adminDb.tx.payments[payment.id].update({
        status: paymentStatus,
        // Overwrite with exact amount PAPI confirms (catches rounding edge cases)
        ...(body.amount != null ? { amount: body.amount } : {}),
        ...(body.currency ? { currency: body.currency } : {}),
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
          ...(body.paymentReference ? { providerPaymentRef: body.paymentReference } : {}),
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
      const ticketId = seat.ticketId ?? newId();
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
  try {
    await adminDb.transact(chunks);
  } catch (error) {
    if (papiStatus !== "SUCCESS") throw error;
    const { tickets } = await adminDb.query({ tickets: { $: { where: { "booking.id": booking.id } } } });
    const expected = ((payment.meta as any)?.seatMeta ?? []).map((s: SeatMeta) => s.ticketId);
    if (expected.length && expected.every((ticketId: string) => tickets.some(t => t.id === ticketId))) return;
    await adminDb.transact([
      adminDb.tx.payments[payment.id].update({ status: "paid", paidAt: Date.now(),
        meta: { ...(payment.meta as any), merchantRef: reference, allocationError: true } }),
      adminDb.tx.bookings[booking.id].update({ status: "payment_review" }),
    ]);
    console.error("Paid booking requires manual allocation/refund", { bookingId: booking.id, paymentId: payment.id });
  }
}
