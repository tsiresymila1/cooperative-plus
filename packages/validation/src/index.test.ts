import { describe, expect, it } from "vitest";

import {
  cancelBookingSchema,
  checkinSchema,
  createBookingSchema,
  createCooperativeSchema,
  destinationQuerySchema,
  holdSeatsSchema,
  money,
  passengerSchema,
  paySchema,
  phone,
  refundSchema,
  routeSchema,
  searchTripsSchema,
  seatMapSchema,
  tripTemplateSchema,
  uuid,
  vehicleSchema,
} from "./index";

const ids = {
  origin: "00000000-0000-4000-8000-000000000001",
  destination: "00000000-0000-4000-8000-000000000002",
  trip: "00000000-0000-4000-8000-000000000003",
  hold: "00000000-0000-4000-8000-000000000004",
  vehicle: "00000000-0000-4000-8000-000000000005",
  route: "00000000-0000-4000-8000-000000000006",
};

const validSearch = {
  origin: ids.origin,
  destination: ids.destination,
  date: "2026-10-15",
};

const validBooking = {
  tripInstanceId: ids.trip,
  holdIds: [ids.hold],
  contact: {
    name: "Mialy",
    phone: "+261341234567",
    email: "mialy@example.test",
  },
  passengers: [{ seatLabel: "A1", name: "Mialy" }],
};

describe("shared scalar schemas", () => {
  it("accepts valid UUID, phone and minor-unit money values", () => {
    expect(uuid.parse(ids.origin)).toBe(ids.origin);
    expect(phone.parse("0341234567")).toBe("0341234567");
    expect(money.parse(0)).toBe(0);
    expect(money.parse(125_000)).toBe(125_000);
  });

  it.each([
    [uuid, "not-a-uuid"],
    [phone, "123456"],
    [phone, "1".repeat(21)],
    [money, -1],
    [money, 10.5],
  ])("rejects an invalid scalar boundary", (schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});

describe("searchTripsSchema", () => {
  it("coerces query strings and applies stable defaults", () => {
    const result = searchTripsSchema.parse({
      ...validSearch,
      passengers: "2",
      limit: "50",
    });

    expect(result).toMatchObject({
      ...validSearch,
      passengers: 2,
      limit: 50,
      sort: "departure",
    });
  });

  it("uses defaults when optional query values are absent", () => {
    expect(searchTripsSchema.parse(validSearch)).toEqual({
      ...validSearch,
      passengers: 1,
      limit: 20,
      sort: "departure",
    });
  });

  it.each([
    ["invalid origin", { ...validSearch, origin: "tana" }],
    ["invalid destination", { ...validSearch, destination: "majunga" }],
    ["invalid date", { ...validSearch, date: "15/10/2026" }],
    ["zero passengers", { ...validSearch, passengers: 0 }],
    ["too many passengers", { ...validSearch, passengers: 21 }],
    ["fractional passengers", { ...validSearch, passengers: 1.5 }],
    ["zero limit", { ...validSearch, limit: 0 }],
    ["limit above maximum", { ...validSearch, limit: 51 }],
    ["negative minimum price", { ...validSearch, priceMin: -1 }],
    ["unsupported vehicle", { ...validSearch, vehicleType: "taxi" }],
    ["unsupported sort", { ...validSearch, sort: "rating" }],
  ])("rejects %s", (_case, input) => {
    expect(searchTripsSchema.safeParse(input).success).toBe(false);
  });

  it("accepts the supported filters and sort choices", () => {
    const parsed = searchTripsSchema.parse({
      ...validSearch,
      priceMin: 10_000,
      priceMax: 25_000,
      vehicleType: "minibus_18",
      cooperativeId: ids.trip,
      sort: "seats",
      cursor: "next-page",
    });

    expect(parsed).toMatchObject({
      priceMin: 10_000,
      priceMax: 25_000,
      vehicleType: "minibus_18",
      cooperativeId: ids.trip,
      sort: "seats",
      cursor: "next-page",
    });
  });
});

describe("destinationQuerySchema", () => {
  it("accepts non-empty queries up to 80 characters", () => {
    expect(destinationQuerySchema.parse({ q: "Antananarivo" })).toEqual({
      q: "Antananarivo",
    });
    expect(destinationQuerySchema.safeParse({ q: "a".repeat(80) }).success).toBe(true);
  });

  it.each(["", "a".repeat(81)])("rejects an out-of-range query", (q) => {
    expect(destinationQuerySchema.safeParse({ q }).success).toBe(false);
  });
});

describe("booking schemas", () => {
  it("accepts a complete booking and defaults its source", () => {
    expect(createBookingSchema.parse(validBooking)).toEqual({
      ...validBooking,
      source: "customer",
    });
  });

  it("accepts the maximum hold size and optional passenger phone", () => {
    const holdIds = Array.from({ length: 20 }, (_, index) =>
      `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
    );
    const result = createBookingSchema.parse({
      ...validBooking,
      holdIds,
      source: "cooperative",
      passengers: [{ seatLabel: "B2", name: "Solo", phone: "0341234567" }],
    });

    expect(result.holdIds).toHaveLength(20);
    expect(result.source).toBe("cooperative");
  });

  it.each([
    ["missing hold", { ...validBooking, holdIds: [] }],
    ["malformed hold", { ...validBooking, holdIds: ["hold-1"] }],
    ["missing passenger", { ...validBooking, passengers: [] }],
    ["missing contact name", { ...validBooking, contact: { ...validBooking.contact, name: "" } }],
    ["short contact phone", { ...validBooking, contact: { ...validBooking.contact, phone: "123" } }],
    ["invalid email", { ...validBooking, contact: { ...validBooking.contact, email: "wrong" } }],
    ["empty seat label", { ...validBooking, passengers: [{ seatLabel: "", name: "Mialy" }] }],
    ["empty passenger name", { ...validBooking, passengers: [{ seatLabel: "A1", name: "" }] }],
  ])("rejects a booking with %s", (_case, input) => {
    expect(createBookingSchema.safeParse(input).success).toBe(false);
  });

  it("enforces seat hold and check-in collection boundaries", () => {
    expect(holdSeatsSchema.parse({ seatLabels: ["A1", "A2"] })).toEqual({
      seatLabels: ["A1", "A2"],
    });
    expect(holdSeatsSchema.safeParse({ seatLabels: [] }).success).toBe(false);
    expect(
      holdSeatsSchema.safeParse({ seatLabels: Array.from({ length: 21 }, () => "A1") }).success,
    ).toBe(false);
    expect(checkinSchema.safeParse({ seatLabels: [] }).success).toBe(false);
  });

  it("validates passenger and cancellation text boundaries", () => {
    expect(passengerSchema.safeParse({ seatLabel: "A1", name: "a".repeat(120) }).success).toBe(true);
    expect(passengerSchema.safeParse({ seatLabel: "A1", name: "a".repeat(121) }).success).toBe(false);
    expect(cancelBookingSchema.safeParse({ reason: "Changement de programme" }).success).toBe(true);
    expect(cancelBookingSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(cancelBookingSchema.safeParse({ reason: "a".repeat(281) }).success).toBe(false);
  });
});

describe("payment schemas", () => {
  it.each([
    { method: "cash", provider: "manual" },
    { method: "mobile_money", provider: "mvola" },
    { method: "mobile_money", provider: "orange" },
    { method: "mobile_money", provider: "airtel" },
    { method: "card", provider: "stripe" },
  ])("accepts supported payment values", (payment) => {
    expect(paySchema.parse(payment)).toEqual(payment);
  });

  it("rejects unsupported payment values", () => {
    expect(paySchema.safeParse({ method: "crypto", provider: "manual" }).success).toBe(false);
    expect(paySchema.safeParse({ method: "cash", provider: "unknown" }).success).toBe(false);
  });

  it("accepts zero and positive integer refunds but rejects invalid amounts", () => {
    expect(refundSchema.parse({ amount: 0, reason: "Annulation" })).toEqual({
      amount: 0,
      reason: "Annulation",
    });
    expect(refundSchema.safeParse({ amount: -1, reason: "Annulation" }).success).toBe(false);
    expect(refundSchema.safeParse({ amount: 1.5, reason: "Annulation" }).success).toBe(false);
    expect(refundSchema.safeParse({ amount: 1000, reason: "" }).success).toBe(false);
  });
});

describe("fleet schemas", () => {
  it("defaults a valid vehicle to active", () => {
    expect(
      vehicleSchema.parse({
        registrationNo: "1234 TAA",
        name: "Sprinter 01",
        type: "minibus_18",
      }),
    ).toEqual({
      registrationNo: "1234 TAA",
      name: "Sprinter 01",
      type: "minibus_18",
      status: "active",
    });
  });

  it.each([
    { registrationNo: "", name: "Sprinter", type: "custom" },
    { registrationNo: "X".repeat(21), name: "Sprinter", type: "custom" },
    { registrationNo: "1234 TAA", name: "", type: "custom" },
    { registrationNo: "1234 TAA", name: "Sprinter", type: "car" },
    { registrationNo: "1234 TAA", name: "Sprinter", type: "custom", status: "sold" },
    { registrationNo: "1234 TAA", name: "Sprinter", type: "custom", notes: "n".repeat(501) },
  ])("rejects an invalid vehicle", (vehicle) => {
    expect(vehicleSchema.safeParse(vehicle).success).toBe(false);
  });

  it("accepts a structured seat map", () => {
    const result = seatMapSchema.parse({
      vehicleId: ids.vehicle,
      rows: 2,
      cols: 3,
      layout: [
        { row: 0, col: 0, type: "driver" },
        { row: 1, col: 0, type: "seat", label: "A1" },
        { row: 1, col: 1, type: "aisle" },
      ],
    });

    expect(result.layout).toHaveLength(3);
  });

  it.each([
    ["invalid vehicle", { vehicleId: "vehicle", rows: 1, cols: 1, layout: [{ row: 0, col: 0, type: "seat" }] }],
    ["zero rows", { vehicleId: ids.vehicle, rows: 0, cols: 1, layout: [{ row: 0, col: 0, type: "seat" }] }],
    ["too many rows", { vehicleId: ids.vehicle, rows: 31, cols: 1, layout: [{ row: 0, col: 0, type: "seat" }] }],
    ["too many columns", { vehicleId: ids.vehicle, rows: 1, cols: 11, layout: [{ row: 0, col: 0, type: "seat" }] }],
    ["empty layout", { vehicleId: ids.vehicle, rows: 1, cols: 1, layout: [] }],
    ["fractional cell", { vehicleId: ids.vehicle, rows: 1, cols: 1, layout: [{ row: 0.5, col: 0, type: "seat" }] }],
    ["unknown cell type", { vehicleId: ids.vehicle, rows: 1, cols: 1, layout: [{ row: 0, col: 0, type: "window" }] }],
  ])("rejects a seat map with %s", (_case, seatMap) => {
    expect(seatMapSchema.safeParse(seatMap).success).toBe(false);
  });
});

describe("route and trip schemas", () => {
  it("accepts routes with priced stops", () => {
    const route = routeSchema.parse({
      originDestinationId: ids.origin,
      destDestinationId: ids.destination,
      basePrice: 25_000,
      distanceKm: 350,
      durationMin: 480,
      stops: [{ destinationId: ids.trip, position: 1, priceFromOrigin: 10_000 }],
    });

    expect(route.stops?.[0]).toEqual({
      destinationId: ids.trip,
      position: 1,
      priceFromOrigin: 10_000,
    });
  });

  it.each([
    { originDestinationId: ids.origin, destDestinationId: ids.destination, basePrice: -1 },
    { originDestinationId: ids.origin, destDestinationId: ids.destination, basePrice: 100, distanceKm: 0 },
    { originDestinationId: ids.origin, destDestinationId: ids.destination, basePrice: 100, durationMin: 1.5 },
    {
      originDestinationId: ids.origin,
      destDestinationId: ids.destination,
      basePrice: 100,
      stops: [{ destinationId: "invalid", position: 1 }],
    },
  ])("rejects an invalid route", (route) => {
    expect(routeSchema.safeParse(route).success).toBe(false);
  });

  it("accepts a complete recurring trip template", () => {
    const trip = tripTemplateSchema.parse({
      routeId: ids.route,
      vehicleId: ids.vehicle,
      recurrenceType: "weekly",
      rrule: "FREQ=WEEKLY;BYDAY=MO",
      startDate: "2026-10-01",
      endDate: "2026-12-31",
      departureTime: "07:30",
      arrivalEstimateMin: 480,
      driverName: "Rakoto",
      driverPhone: "0341234567",
      priceOverride: 30_000,
      excludedDates: ["2026-11-01"],
      notes: "Départ chaque lundi",
    });

    expect(trip.recurrenceType).toBe("weekly");
    expect(trip.departureTime).toBe("07:30");
  });

  it.each([
    ["bad route", { routeId: "route", vehicleId: ids.vehicle, recurrenceType: "daily", startDate: "2026-10-01", departureTime: "07:30" }],
    ["bad recurrence", { routeId: ids.route, vehicleId: ids.vehicle, recurrenceType: "hourly", startDate: "2026-10-01", departureTime: "07:30" }],
    ["bad start date", { routeId: ids.route, vehicleId: ids.vehicle, recurrenceType: "daily", startDate: "01-10-2026", departureTime: "07:30" }],
    ["bad time shape", { routeId: ids.route, vehicleId: ids.vehicle, recurrenceType: "daily", startDate: "2026-10-01", departureTime: "7:30" }],
    ["negative duration", { routeId: ids.route, vehicleId: ids.vehicle, recurrenceType: "daily", startDate: "2026-10-01", departureTime: "07:30", arrivalEstimateMin: -1 }],
    ["negative price", { routeId: ids.route, vehicleId: ids.vehicle, recurrenceType: "daily", startDate: "2026-10-01", departureTime: "07:30", priceOverride: -1 }],
    ["bad excluded date", { routeId: ids.route, vehicleId: ids.vehicle, recurrenceType: "daily", startDate: "2026-10-01", departureTime: "07:30", excludedDates: ["tomorrow"] }],
  ])("rejects a trip template with %s", (_case, trip) => {
    expect(tripTemplateSchema.safeParse(trip).success).toBe(false);
  });
});

describe("createCooperativeSchema", () => {
  it("accepts a cooperative and applies the growth plan default", () => {
    expect(
      createCooperativeSchema.parse({
        slug: "cotisse-transport",
        legalName: "Cotisse Transport SARL",
        displayName: "Cotisse",
        ownerEmail: "owner@example.test",
      }),
    ).toEqual({
      slug: "cotisse-transport",
      legalName: "Cotisse Transport SARL",
      displayName: "Cotisse",
      ownerEmail: "owner@example.test",
      planCode: "growth",
    });
  });

  it.each([
    ["short slug", { slug: "a", legalName: "Legal", displayName: "Display", ownerEmail: "owner@example.test" }],
    ["uppercase slug", { slug: "Coop", legalName: "Legal", displayName: "Display", ownerEmail: "owner@example.test" }],
    ["space in slug", { slug: "my coop", legalName: "Legal", displayName: "Display", ownerEmail: "owner@example.test" }],
    ["long slug", { slug: "a".repeat(41), legalName: "Legal", displayName: "Display", ownerEmail: "owner@example.test" }],
    ["short legal name", { slug: "coop", legalName: "L", displayName: "Display", ownerEmail: "owner@example.test" }],
    ["short display name", { slug: "coop", legalName: "Legal", displayName: "D", ownerEmail: "owner@example.test" }],
    ["invalid owner email", { slug: "coop", legalName: "Legal", displayName: "Display", ownerEmail: "owner" }],
    ["unsupported plan", { slug: "coop", legalName: "Legal", displayName: "Display", ownerEmail: "owner@example.test", planCode: "free" }],
  ])("rejects a cooperative with %s", (_case, cooperative) => {
    expect(createCooperativeSchema.safeParse(cooperative).success).toBe(false);
  });
});
