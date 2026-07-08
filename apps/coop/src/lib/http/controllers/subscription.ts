import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { initiateSubscriptionPayment, handleSubscriptionWebhook } from "../services/subscription";

const initiateSchema = z.object({
  coopId: z.string().min(1),
  planId: z.string().min(1),
});

export const initiateSubscriptionHandler = factory.createHandlers(
  jsonBody(initiateSchema),
  async (c) => {
    const { coopId, planId } = c.req.valid("json");
    const baseUrl = new URL(c.req.url).origin;
    return c.json(await initiateSubscriptionPayment({ coopId, planId, baseUrl }));
  },
);

export const subscriptionWebhookHandler = factory.createHandlers(async (c) => {
  await handleSubscriptionWebhook(await c.req.json());
  return c.json({ ok: true });
});
