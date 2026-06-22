import { z } from "zod";

/* Shared scalars */
export const uuid = z.string().uuid();
export const phone = z.string().min(7).max(20);
export const money = z.number().int().nonnegative(); // minor units

/* Search */
export const searchTripsSchema = z.object({
  origin: uuid,
  destination: uuid,
  date: z.string().date(),
  passengers: z.coerce.number().int().min(1).max(20).default(1),
  priceMin: money.optional(),
  priceMax: money.optional(),
  vehicleType: z.enum(["minibus_15", "minibus_18", "bus_30", "custom"]).optional(),
  cooperativeId: uuid.optional(),
  sort: z.enum(["price", "departure", "seats"]).default("departure"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchTripsInput = z.infer<typeof searchTripsSchema>;

export const destinationQuerySchema = z.object({ q: z.string().min(1).max(80) });

/* Holds + booking */
export const holdSeatsSchema = z.object({
  seatLabels: z.array(z.string().min(1)).min(1).max(20),
});

export const passengerSchema = z.object({
  seatLabel: z.string().min(1),
  name: z.string().min(1).max(120),
  phone: phone.optional(),
});

export const createBookingSchema = z.object({
  tripInstanceId: uuid,
  holdIds: z.array(uuid).min(1),
  source: z.enum(["anonymous", "customer", "cooperative"]).default("customer"),
  contact: z.object({ name: z.string().min(1), phone, email: z.string().email().optional() }),
  passengers: z.array(passengerSchema).min(1),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({ reason: z.string().min(1).max(280) });
export const checkinSchema = z.object({ seatLabels: z.array(z.string().min(1)).min(1) });

/* Payments */
export const paySchema = z.object({
  method: z.enum(["cash", "mobile_money", "card"]),
  provider: z.enum(["mvola", "orange", "airtel", "stripe", "manual"]),
});
export const refundSchema = z.object({ amount: money, reason: z.string().min(1) });

/* Fleet */
const seatCell = z.object({
  row: z.number().int(),
  col: z.number().int(),
  type: z.enum(["seat", "aisle", "door", "driver", "empty"]),
  label: z.string().optional(),
});
export const vehicleSchema = z.object({
  registrationNo: z.string().min(1).max(20),
  name: z.string().min(1).max(80),
  type: z.enum(["minibus_15", "minibus_18", "bus_30", "custom"]),
  status: z.enum(["active", "maintenance", "retired"]).default("active"),
  notes: z.string().max(500).optional(),
});
export const seatMapSchema = z.object({
  vehicleId: uuid,
  rows: z.number().int().min(1).max(30),
  cols: z.number().int().min(1).max(10),
  layout: z.array(seatCell).min(1),
});

/* Routes & trips */
export const routeSchema = z.object({
  originDestinationId: uuid,
  destDestinationId: uuid,
  basePrice: money,
  distanceKm: z.number().int().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  stops: z.array(z.object({ destinationId: uuid, position: z.number().int(), priceFromOrigin: money.optional() })).optional(),
});
export const tripTemplateSchema = z.object({
  routeId: uuid,
  vehicleId: uuid,
  recurrenceType: z.enum(["one_time", "daily", "weekly", "monthly", "custom"]),
  rrule: z.string().optional(),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  arrivalEstimateMin: z.number().int().positive().optional(),
  driverName: z.string().optional(),
  driverPhone: phone.optional(),
  priceOverride: money.optional(),
  excludedDates: z.array(z.string().date()).optional(),
  notes: z.string().max(500).optional(),
});

/* Platform admin */
export const createCooperativeSchema = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  legalName: z.string().min(2),
  displayName: z.string().min(2),
  ownerEmail: z.string().email(),
  planCode: z.enum(["starter", "growth", "pro", "enterprise"]).default("growth"),
});
