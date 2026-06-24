import { i } from "@instantdb/core";

/**
 * Cooperative Plus — InstantDB schema.
 * Money = integer minor units (number). Tenancy via `cooperative` links.
 * Seat safety: `seatKey` (= `${tripInstanceId}_${seatLabel}`) is .unique() on
 * both holds and tickets → duplicate create fails = no double-booking.
 */
const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
      name: i.string().optional(),
      phone: i.string().optional(),
      locale: i.string().optional(),
      isPlatformAdmin: i.boolean().optional(),
    }),
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),

    cooperatives: i.entity({
      slug: i.string().unique().indexed(),
      legalName: i.string(),
      displayName: i.string().indexed(),
      logoUrl: i.string().optional(),
      brandColor: i.string().optional(),
      paymentMethods: i.json().optional(), // e.g. ["cash","mobile_money","card"]
      email: i.string().optional(),
      phone: i.string().optional(),
      address: i.string().optional(),
      region: i.string().indexed().optional(),
      currency: i.string(),
      timezone: i.string(),
      subscriptionStatus: i.string().indexed(),
      cutoffHours: i.number(),
      cutoffMinutes: i.number().optional(), // booking cutoff before departure (minutes)
      refundPct: i.number(),
      createdAt: i.date().indexed(),
      deletedAt: i.date().optional(),
    }),

    // Email+password login for coop owners (InstantDB itself is passwordless).
    credentials: i.entity({
      email: i.string().unique().indexed(),
      passwordHash: i.string(),
      createdAt: i.date(),
    }),

    memberships: i.entity({
      role: i.string().indexed(),
      permissions: i.json(),
      status: i.string().indexed(),
      createdAt: i.date().indexed(),
    }),

    plans: i.entity({
      code: i.string().unique().indexed(),
      name: i.string(),
      priceAmount: i.number(),
      currency: i.string(),
      interval: i.string(),
      maxVehicles: i.number(),
      maxRoutes: i.number(),
      maxAssistants: i.number(),
      maxTripsMonth: i.number(),
      transactionFeeBps: i.number(),
      isActive: i.boolean().indexed(),
    }),

    subscriptions: i.entity({
      status: i.string().indexed(),
      currentPeriodEnd: i.date().optional(),
      trialEndsAt: i.date().optional(),
      cancelAtPeriodEnd: i.boolean().optional(),
      externalRef: i.string().optional(),
      createdAt: i.date().indexed(),
    }),

    vehicles: i.entity({
      registrationNo: i.string().indexed(),
      name: i.string(),
      type: i.string().indexed(),
      seatCount: i.number(),
      status: i.string().indexed(),
      notes: i.string().optional(),
      createdAt: i.date().indexed(),
      deletedAt: i.date().optional(),
    }),

    seatMaps: i.entity({
      version: i.number(),
      rows: i.number(),
      cols: i.number(),
      layout: i.json(),
      isActive: i.boolean().indexed(),
      createdAt: i.date(),
    }),

    destinations: i.entity({
      name: i.string().indexed(),
      slug: i.string().indexed().optional(), // stable key, e.g. "antananarivo"
      region: i.string().indexed().optional(),
      country: i.string(),
      lat: i.number().optional(),
      lng: i.number().optional(),
      isPopular: i.boolean().indexed(),
      isGlobal: i.boolean().indexed(),
      createdAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    // Trip tags (Standard / Premium / VIP…). Global (admin) or per-coop.
    tags: i.entity({
      name: i.string().indexed(),
      color: i.string(),            // background hex; badge text is always white
      isGlobal: i.boolean().indexed(),
      createdAt: i.date(),
      deletedAt: i.date().optional(),
    }),

    routes: i.entity({
      name: i.string(),
      basePrice: i.number(),
      currency: i.string(),
      distanceKm: i.number().optional(),
      durationMin: i.number().optional(),
      status: i.string().indexed(),
      createdAt: i.date().indexed(),
      deletedAt: i.date().optional(),
    }),

    tripTemplates: i.entity({
      recurrenceType: i.string(),
      rrule: i.string().optional(),
      startDate: i.string(),
      endDate: i.string().optional(),
      departureTime: i.string(),
      arrivalEstimateMin: i.number().optional(),
      driverName: i.string().optional(),
      driverPhone: i.string().optional(),
      priceOverride: i.number().optional(),
      notes: i.string().optional(),
      excludedDates: i.json().optional(),
      isActive: i.boolean().indexed(),
      createdAt: i.date(),
    }),

    tripInstances: i.entity({
      // denormalized indexed fields for public search
      originName: i.string().indexed(),
      destName: i.string().indexed(),
      departDate: i.string().indexed(), // yyyy-mm-dd
      departureAt: i.date().indexed(),
      arrivalEstimateAt: i.date().optional(),
      routeName: i.string(),
      coopName: i.string(),
      vehicleName: i.string(),
      status: i.string().indexed(),
      price: i.number().indexed(),
      currency: i.string(),
      seatMapSnapshot: i.json(),
      seatsTotal: i.number(),
      seatsBooked: i.number(),
      driverName: i.string().optional(),
      driverPhone: i.string().optional(),
      notes: i.string().optional(),
      createdAt: i.date().indexed(),
      deletedAt: i.date().optional(),
    }),

    seatHolds: i.entity({
      seatKey: i.string().unique().indexed(), // `${instanceId}_${seatLabel}`
      seatLabel: i.string(),
      sessionToken: i.string().optional(),
      expiresAt: i.date().indexed(),
      createdAt: i.date(),
    }),

    bookings: i.entity({
      reference: i.string().unique().indexed(),
      source: i.string().indexed(),
      contactName: i.string(),
      contactPhone: i.string(),
      contactEmail: i.string().optional(),
      seatCount: i.number(),
      totalAmount: i.number(),
      currency: i.string(),
      status: i.string().indexed(),
      holdExpiresAt: i.date().optional(),
      cancelledAt: i.date().optional(),
      cancelReason: i.string().optional(),
      createdAt: i.date().indexed(),
      deletedAt: i.date().optional(),
    }),

    tickets: i.entity({
      seatKey: i.string().unique().indexed(), // hard overbooking guard
      seatLabel: i.string(),
      passengerName: i.string(),
      passengerPhone: i.string().optional(),
      price: i.number(),
      checkedInAt: i.date().optional(),
      qrToken: i.string().unique().indexed(),
      createdAt: i.date(),
    }),

    payments: i.entity({
      method: i.string().indexed(),
      provider: i.string(),
      amount: i.number(),
      currency: i.string(),
      status: i.string().indexed(),
      providerRef: i.string().indexed().optional(),
      proofUrl: i.string().optional(),
      paidAt: i.date().optional(),
      meta: i.json().optional(),
      createdAt: i.date().indexed(),
    }),

    refunds: i.entity({
      amount: i.number(),
      reason: i.string().optional(),
      status: i.string(),
      createdAt: i.date(),
    }),

    notifications: i.entity({
      channel: i.string(),
      event: i.string().indexed(),
      template: i.string(),
      payload: i.json(),
      status: i.string().indexed(),
      attempts: i.number(),
      nextAttemptAt: i.date().indexed().optional(),
      sentAt: i.date().optional(),
      error: i.string().optional(),
      createdAt: i.date().indexed(),
    }),

    auditLogs: i.entity({
      action: i.string(),
      entityType: i.string(),
      entityId: i.string().optional(),
      before: i.json().optional(),
      after: i.json().optional(),
      createdAt: i.date().indexed(),
    }),
  },

  links: {
    // Global destinations a cooperative has chosen to use (many-to-many).
    coopEnabledDestinations: { forward: { on: "cooperatives", has: "many", label: "enabledDestinations" }, reverse: { on: "destinations", has: "many", label: "enabledByCoops" } },

    membershipCoop: { forward: { on: "memberships", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "members" } },
    membershipUser: { forward: { on: "memberships", has: "one", label: "user" }, reverse: { on: "$users", has: "many", label: "memberships" } },

    subPlan: { forward: { on: "subscriptions", has: "one", label: "plan" }, reverse: { on: "plans", has: "many", label: "subscriptions" } },
    subCoop: { forward: { on: "subscriptions", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "subscriptions" } },

    vehicleCoop: { forward: { on: "vehicles", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "vehicles" } },
    seatMapVehicle: { forward: { on: "seatMaps", has: "one", label: "vehicle" }, reverse: { on: "vehicles", has: "many", label: "seatMaps" } },
    seatMapCoop: { forward: { on: "seatMaps", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "seatMaps" } },

    destCoop: { forward: { on: "destinations", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "destinations" } },
    tagCoop: { forward: { on: "tags", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "tags" } },
    instanceTag: { forward: { on: "tripInstances", has: "one", label: "tag" }, reverse: { on: "tags", has: "many", label: "tripInstances" } },
    routeCoop: { forward: { on: "routes", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "routes" } },
    routeOrigin: { forward: { on: "routes", has: "one", label: "origin" }, reverse: { on: "destinations", has: "many", label: "routesFrom" } },
    routeDest: { forward: { on: "routes", has: "one", label: "destination" }, reverse: { on: "destinations", has: "many", label: "routesTo" } },

    templateCoop: { forward: { on: "tripTemplates", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "tripTemplates" } },
    templateRoute: { forward: { on: "tripTemplates", has: "one", label: "route" }, reverse: { on: "routes", has: "many", label: "tripTemplates" } },
    templateVehicle: { forward: { on: "tripTemplates", has: "one", label: "vehicle" }, reverse: { on: "vehicles", has: "many", label: "tripTemplates" } },

    instanceCoop: { forward: { on: "tripInstances", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "tripInstances" } },
    instanceRoute: { forward: { on: "tripInstances", has: "one", label: "route" }, reverse: { on: "routes", has: "many", label: "tripInstances" } },
    instanceVehicle: { forward: { on: "tripInstances", has: "one", label: "vehicle" }, reverse: { on: "vehicles", has: "many", label: "tripInstances" } },
    instanceTemplate: { forward: { on: "tripInstances", has: "one", label: "template" }, reverse: { on: "tripTemplates", has: "many", label: "instances" } },

    holdInstance: { forward: { on: "seatHolds", has: "one", label: "tripInstance" }, reverse: { on: "tripInstances", has: "many", label: "holds" } },
    holdCoop: { forward: { on: "seatHolds", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "holds" } },
    holdUser: { forward: { on: "seatHolds", has: "one", label: "user" }, reverse: { on: "$users", has: "many", label: "holds" } },

    bookingCoop: { forward: { on: "bookings", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "bookings" } },
    bookingInstance: { forward: { on: "bookings", has: "one", label: "tripInstance" }, reverse: { on: "tripInstances", has: "many", label: "bookings" } },
    bookingCustomer: { forward: { on: "bookings", has: "one", label: "customer" }, reverse: { on: "$users", has: "many", label: "bookings" } },
    bookingCreatedBy: { forward: { on: "bookings", has: "one", label: "createdBy" }, reverse: { on: "$users", has: "many", label: "bookingsCreated" } },

    ticketBooking: { forward: { on: "tickets", has: "one", label: "booking" }, reverse: { on: "bookings", has: "many", label: "tickets" } },
    ticketCoop: { forward: { on: "tickets", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "tickets" } },
    ticketInstance: { forward: { on: "tickets", has: "one", label: "tripInstance" }, reverse: { on: "tripInstances", has: "many", label: "tickets" } },

    paymentCoop: { forward: { on: "payments", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "payments" } },
    paymentBooking: { forward: { on: "payments", has: "one", label: "booking" }, reverse: { on: "bookings", has: "many", label: "payments" } },
    paymentSub: { forward: { on: "payments", has: "one", label: "subscription" }, reverse: { on: "subscriptions", has: "many", label: "payments" } },

    refundPayment: { forward: { on: "refunds", has: "one", label: "payment" }, reverse: { on: "payments", has: "many", label: "refunds" } },
    refundCoop: { forward: { on: "refunds", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "refunds" } },

    notifCoop: { forward: { on: "notifications", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "notifications" } },
    notifUser: { forward: { on: "notifications", has: "one", label: "user" }, reverse: { on: "$users", has: "many", label: "notifications" } },

    auditCoop: { forward: { on: "auditLogs", has: "one", label: "cooperative" }, reverse: { on: "cooperatives", has: "many", label: "auditLogs" } },
    auditActor: { forward: { on: "auditLogs", has: "one", label: "actor" }, reverse: { on: "$users", has: "many", label: "audits" } },
  },
});

export type AppSchema = typeof schema;
export default schema;
