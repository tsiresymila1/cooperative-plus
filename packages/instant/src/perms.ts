import type { InstantRules } from "@instantdb/core";

// Reusable expressions
const admin = "(true in auth.ref('$user.isPlatformAdmin'))";
// for entities that LINK to a cooperative (vehicles, routes, …)
const member = "auth.id in data.ref('cooperative.members.user.id')";
const memberOrAdmin = `(${admin} || ${member})`;
// for the cooperatives entity itself (its members are a direct reverse link)
const selfMember = "auth.id in data.ref('members.user.id')";
const authed = "auth.id != null";

const rules = {
  $users: {
    allow: {
      view: `(auth.id == data.id || ${admin})`,
      create: "true",
      update: `(auth.id == data.id || ${admin})`,
      delete: "false", // $users system entity — cannot be deleted; revoke access instead
    },
  },

  // Storage (logos, payment proofs): public read, authed upload.
  $files: {
    allow: { view: "true", create: authed, delete: authed },
  },

  // Password hashes — only the server (admin token) touches these.
  credentials: {
    allow: { view: "false", create: "false", update: "false", delete: admin },
  },

  // Public, read-only network data (search needs these open)
  cooperatives: {
    allow: { view: "true", create: admin, update: `(${admin} || ${selfMember})`, delete: admin },
  },
  destinations: { allow: { view: "true", create: memberOrAdmin, update: memberOrAdmin, delete: memberOrAdmin } },
  routes: { allow: { view: "true", create: memberOrAdmin, update: memberOrAdmin, delete: memberOrAdmin } },
  vehicles: { allow: { view: "true", create: memberOrAdmin, update: memberOrAdmin, delete: memberOrAdmin } },
  seatMaps: { allow: { view: "true", create: memberOrAdmin, update: memberOrAdmin, delete: memberOrAdmin } },
  tripTemplates: { allow: { view: memberOrAdmin, create: memberOrAdmin, update: memberOrAdmin, delete: memberOrAdmin } },
  tripInstances: { allow: { view: "true", create: memberOrAdmin, update: memberOrAdmin, delete: memberOrAdmin } },
  plans: { allow: { view: "true", create: admin, update: admin, delete: admin } },

  // Membership: visible to self or co-members/admin; managed by owner/admin
  memberships: {
    allow: {
      view: `(auth.id == data.ref('user.id') || ${memberOrAdmin})`,
      create: memberOrAdmin,
      update: memberOrAdmin,
      delete: memberOrAdmin,
    },
  },

  // Booking surface: created by any authed user (incl. guest); read by owner / coop / admin
  bookings: {
    allow: {
      view: `(auth.id in data.ref('customer.id') || ${memberOrAdmin})`,
      create: authed,
      update: `(auth.id in data.ref('customer.id') || ${memberOrAdmin})`,
      delete: memberOrAdmin,
    },
  },
  seatHolds: { allow: { view: "true", create: authed, update: authed, delete: authed } },
  tickets: {
    allow: {
      view: `(auth.id in data.ref('booking.customer.id') || ${memberOrAdmin})`,
      create: authed,
      update: memberOrAdmin,
      delete: memberOrAdmin,
    },
  },

  payments: {
    allow: {
      view: `(auth.id in data.ref('booking.customer.id') || ${memberOrAdmin})`,
      create: authed,
      update: memberOrAdmin,
      delete: admin,
    },
  },
  refunds: { allow: { view: memberOrAdmin, create: memberOrAdmin, update: memberOrAdmin, delete: admin } },
  subscriptions: { allow: { view: memberOrAdmin, create: admin, update: admin, delete: admin } },

  notifications: {
    allow: {
      view: `(auth.id in data.ref('user.id') || ${memberOrAdmin})`,
      create: authed, update: memberOrAdmin, delete: memberOrAdmin,
    },
  },
  auditLogs: { allow: { view: memberOrAdmin, create: authed, update: "false", delete: "false" } },
} satisfies InstantRules;

export default rules;
