import { Hono } from "hono";
import { z } from "zod";
import { jsonBody } from "../validate";
import { requireUser } from "../services/session";
import { createBooking, holdSeats } from "../services/booking";

const labels = z.array(z.string().min(1).max(30)).min(1).max(100).refine(a => new Set(a).size === a.length);
const slot = { instanceId: z.string().uuid(), tripVehicleId: z.string().uuid().nullable().optional() };
const booking = z.object({ ...slot, holdIds: z.array(z.string().uuid()).min(1).max(100),
  seats: z.array(z.object({ label: z.string().min(1).max(30), passengerName: z.string().trim().min(1).max(150) })).min(1).max(100)
    .refine(a => new Set(a.map(s => s.label)).size === a.length),
  contactName: z.string().trim().min(1).max(150), contactPhone: z.string().trim().min(6).max(30),
  contactEmail: z.string().email().or(z.literal("")).optional(),
  method: z.enum(["cash", "mobile_money"]), source: z.enum(["mobile", "customer"]),
});
export const bookingRoute = new Hono()
  .post("/hold", jsonBody(z.object({ ...slot, labels })), async c =>
    c.json(await holdSeats(await requireUser(c.req.header("Authorization")), c.req.valid("json"))))
  .post("/create", jsonBody(booking), async c =>
    c.json(await createBooking(await requireUser(c.req.header("Authorization")), c.req.valid("json"))));
