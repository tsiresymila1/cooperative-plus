import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { initiatePayment, handleWebhook } from "../services/payment";

const seatMetaSchema = z.object({
  label: z.string(),
  passengerName: z.string(),
  price: z.number(),
});

const initiateSchema = z.object({
  bookingReference: z.string().min(1),
  instanceId: z.string().optional(),
  coopId: z.string().nullable().optional(),
  holdIds: z.array(z.string()).optional(),
  seatMeta: z.array(seatMetaSchema).optional(),
});

export const initiateHandler = factory.createHandlers(
  jsonBody(initiateSchema),
  async (c) => {
    const { bookingReference, instanceId, coopId, holdIds, seatMeta } = c.req.valid("json");
    const result = await initiatePayment({ bookingReference, instanceId, coopId: coopId ?? null, holdIds, seatMeta });
    return c.json(result);
  },
);

export const webhookHandler = factory.createHandlers(async (c) => {
  const body = await c.req.json();
  await handleWebhook(body);
  return c.json({ ok: true });
});
