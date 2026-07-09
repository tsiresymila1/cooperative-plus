import { adminDb, id as newId } from "@cp/instant/admin";
import { decrypt, isEncrypted } from "@cp/crypto";
import { nextPeriodEnd } from "@cp/instant/subscription";
import { HttpError } from "../errors";

const PAPI_URL = "https://app.papi.mg/dashboard/api/payment-links";
// Subscription = coop pays the PLATFORM, so always the platform PAPI account —
// never the coop's own key (that one collects the coop's rider payments).
const PLATFORM_PAPI_KEY = process.env.PAPI_API_KEY;
const TEST_MODE = process.env.PAPI_TEST_MODE === "true";

/**
 * Start a PAPI payment for a coop's own subscription (self-serve renewal /
 * upgrade). Returns the hosted payment-link URL; the webhook does the
 * activation once PAPI confirms.
 */
export async function initiateSubscriptionPayment(input: {
  coopId: string;
  planId: string;
  baseUrl: string;
}): Promise<{ url: string }> {
  const { coopId, planId, baseUrl } = input;

  if (!PLATFORM_PAPI_KEY) throw new HttpError(422, "Paiement plateforme non configuré (PAPI_API_KEY)");

  const { cooperatives } = await adminDb.query({
    cooperatives: { $: { where: { id: coopId } }, subscriptions: {} },
  });
  const coop = cooperatives?.[0];
  if (!coop) throw new HttpError(404, "Coopérative introuvable");

  const { plans } = await adminDb.query({ plans: { $: { where: { id: planId } } } });
  const plan = plans?.[0];
  if (!plan) throw new HttpError(404, "Plan introuvable");
  if (!plan.priceAmount || plan.priceAmount <= 0) throw new HttpError(422, "Ce plan est gratuit");

  // Platform key is stored encrypted in the env var — decrypt before use.
  const papiApiKey = isEncrypted(PLATFORM_PAPI_KEY) ? decrypt(PLATFORM_PAPI_KEY) : PLATFORM_PAPI_KEY;

  // Short ref — PAPI's paymentreference column is small (~booking-ref length).
  // coopId isn't needed here: the webhook matches on providerRef + payment link.
  const reference = `SUB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const sub = (coop.subscriptions ?? [])[0];

  const papiRes = await fetch(PAPI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Token: papiApiKey },
    body: JSON.stringify({
      amount: plan.priceAmount,
      clientName: coop.displayName,
      reference,
      description: `Abonnement ${plan.name} — ${coop.displayName}`,
      successUrl: `${baseUrl}/${coop.slug}/abonnement?payment=success`,
      failureUrl: `${baseUrl}/${coop.slug}/abonnement?payment=failed`,
      notificationUrl: `${baseUrl}/api/subscription/webhook`,
      validDuration: 30,
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
        amount: plan.priceAmount,
        currency: plan.currency ?? "MGA",
        status: "pending",
        providerRef: reference,
        meta: {
          kind: "subscription",
          planId,
          interval: plan.interval ?? "month",
          notificationToken: papiData.data.notificationToken,
          testMode: TEST_MODE,
        },
        createdAt: Date.now(),
      })
      .link({ cooperative: coopId, ...(sub?.id ? { subscription: sub.id } : {}) }),
  );

  return { url: papiData.data.paymentLink };
}

type PapiWebhookPayload = {
  paymentStatus: string;
  amount?: number;
  currency?: string;
  paymentReference?: string;
  merchantPaymentReference?: string;
  notificationToken?: string;
  message?: string | null;
};

export async function handleSubscriptionWebhook(body: PapiWebhookPayload): Promise<void> {
  const reference = body.merchantPaymentReference;
  const papiStatus = body.paymentStatus?.toUpperCase();
  if (!reference || !papiStatus) throw new HttpError(400, "Payload invalide");

  const { payments } = await adminDb.query({
    payments: { $: { where: { providerRef: reference } }, subscription: {}, cooperative: {} },
  });
  const payment = payments?.[0];
  if (!payment) throw new HttpError(404, "Paiement introuvable");
  if (payment.status === "paid" || payment.status === "failed") return; // idempotent

  const storedToken = (payment.meta as any)?.notificationToken;
  if (storedToken && body.notificationToken && storedToken !== body.notificationToken)
    throw new HttpError(401, "notificationToken invalide");

  const meta = (payment.meta as any) ?? {};
  const sub = (payment as any).subscription;
  const coopId = (payment as any).cooperative?.id;

  const chunks: any[] = [];

  if (papiStatus === "SUCCESS") {
    const end = nextPeriodEnd(sub?.currentPeriodEnd ?? null, Date.now(), meta.interval ?? "month");
    chunks.push(
      adminDb.tx.payments[payment.id].update({
        status: "paid",
        paidAt: Date.now(),
        ...(body.amount != null ? { amount: body.amount } : {}),
        ...(body.paymentReference ? { providerRef: body.paymentReference } : {}),
        meta: { ...meta, merchantRef: reference, papiMessage: body.message },
      }),
    );
    if (sub?.id) {
      chunks.push(
        adminDb.tx.subscriptions[sub.id]
          .update({ status: "active", currentPeriodEnd: end })
          .link(meta.planId ? { plan: meta.planId } : {}),
      );
    }
    if (coopId) chunks.push(adminDb.tx.cooperatives[coopId].update({ subscriptionStatus: "active" }));
  } else if (papiStatus === "FAILED") {
    chunks.push(adminDb.tx.payments[payment.id].update({ status: "failed", meta: { ...meta, papiMessage: body.message } }));
  }

  if (chunks.length) await adminDb.transact(chunks);
}
