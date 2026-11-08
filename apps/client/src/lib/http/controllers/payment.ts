import { requireUser } from "../services/session";
import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { initiatePayment, handleWebhook } from "../services/payment";

const initiateSchema = z.object({ bookingReference: z.string().min(1).max(100) });

export const initiateHandler = factory.createHandlers(
  jsonBody(initiateSchema),
  async (c) => {
    const userId = await requireUser(c.req.header("Authorization"));
    const result = await initiatePayment({ bookingReference: c.req.valid("json").bookingReference, userId });
    return c.json(result);
  },
);

export const webhookHandler = factory.createHandlers(async (c) => {
  const body = await c.req.json();
  await handleWebhook(body);
  return c.json({ ok: true });
});
