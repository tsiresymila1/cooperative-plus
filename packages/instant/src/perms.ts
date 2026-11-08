import type { InstantRules } from "@instantdb/core";

// Reusable expressions
const admin = "(true in auth.ref('$user.isPlatformAdmin'))";
// Match status, cooperative and permission on the SAME server-maintained membership.
function access(cooperative: string, permission?: string) {
  const available = cooperative === "[data.id]" ? "data.subscriptionStatus != 'suspended'"
    : cooperative.includes("tripInstance.") ? "!('suspended' in data.ref('tripInstance.cooperative.subscriptionStatus'))"
    : "!('suspended' in data.ref('cooperative.subscriptionStatus'))";
  return `(${admin} || (${available} && auth.ref('$user.memberships.access').exists(m, m.status == 'active' && m.cooperativeId in ${cooperative}${permission ? ` && (m.role == 'owner' || '${permission}' in m.permissions)` : ""})))`;
}
const memberOrAdmin = access("data.ref('cooperative.id')");
const selfMember = access("[data.id]", "settings");
const tripVehicleMember = access("data.ref('tripInstance.cooperative.id')", "trips");
const permission = (name: string) => access("data.ref('cooperative.id')", name);
const profileFields = "request.modifiedFields.all(field, field in ['displayName', 'legalName', 'logoUrl', 'brandColor', 'paymentMethods', 'email', 'phone', 'address', 'region', 'timezone', 'cutoffHours', 'cutoffMinutes', 'refundPct', 'enabledDestinations'])";
const authed = "auth.id != null";

const rules = {
  rateLimits: { allow: { view: "false", create: "false", update: "false", delete: "false" } },
  $users: {
    allow: {
      view: `(auth.id == data.id || ${admin})`,
      create: "!('isPlatformAdmin' in request.modifiedFields)",
      update: `(${admin} || (auth.id == data.id && request.modifiedFields.all(field, field in ['name', 'phone', 'locale'])))`,
      delete: "false", // $users system entity — cannot be deleted; revoke access instead
    },
  },

  // Public assets are explicit; private files and mutations stay owner-scoped.
  $files: {
    allow: {
      view: `(${admin} || data.path.startsWith('users/' + auth.id + '/') || data.path.matches('^users/[^/]+/public/.*') || data.path.matches('^coops/[^/]+/logo-.*'))`,
      create: `(${admin} || (${authed} && data.path.startsWith('users/' + auth.id + '/')))`,
      update: `(${admin} || (${authed} && data.path.startsWith('users/' + auth.id + '/')))`,
      delete: `(${admin} || (${authed} && data.path.startsWith('users/' + auth.id + '/')))`,
    },
  },

  // Password hashes — only the server (admin token) touches these.
  credentials: {
    allow: { view: "false", create: "false", update: "false", delete: admin },
  },

  // Public, read-only network data (search needs these open)
  cooperatives: {
    allow: { view: "true", create: admin, update: `(${admin} || (${selfMember} && ${profileFields}))`, delete: admin },
  },
  destinations: { allow: { view: "true", create: permission("routes"), update: permission("routes"), delete: permission("routes") } },
  tags: { allow: { view: "true", create: permission("trips"), update: permission("trips"), delete: permission("trips") } },
  // Public can submit a coop application; only platform admins read/manage them.
  coopRequests: { allow: { view: admin, create: "true", update: admin, delete: admin } },
  routes: { allow: { view: "true", create: permission("routes"), update: permission("routes"), delete: permission("routes") } },
  vehicles: { allow: { view: "true", create: permission("vehicles"), update: permission("vehicles"), delete: permission("vehicles") } },
  vehicleModels: { allow: { view: "true", create: permission("models"), update: permission("models"), delete: permission("models") } },
  drivers: { allow: { view: permission("drivers"), create: permission("drivers"), update: permission("drivers"), delete: permission("drivers") } },
  tripVehicles: { allow: { view: "true", create: tripVehicleMember, update: tripVehicleMember, delete: tripVehicleMember } },
  seatMaps: { allow: { view: "true", create: permission("vehicles"), update: permission("vehicles"), delete: permission("vehicles") } },
  tripTemplates: { allow: { view: permission("trips"), create: permission("trips"), update: permission("trips"), delete: permission("trips") } },
  tripInstances: { allow: { view: "true", create: permission("trips"), update: permission("trips"), delete: permission("trips") } },
  plans: { allow: { view: "true", create: admin, update: admin, delete: admin } },

  // Membership writes are server-only; owner/admin authorization is enforced by Hono.
  memberships: {
    allow: {
      view: `(auth.id in data.ref('user.id') || ${memberOrAdmin})`,
      create: "false",
      update: "false",
      delete: "false",
    },
  },

  // Traveler booking writes go through the authenticated server API.
  bookings: {
    allow: {
      view: `(auth.id in data.ref('customer.id') || ${permission("bookings")})`,
      create: permission("bookings"),
      update: `(${permission("bookings")} || (auth.id in data.ref('customer.id') && data.status == 'pending' && newData.status == 'cancelled' && request.modifiedFields.all(f, f in ['status', 'cancelledAt', 'cancelReason'])))`,
      delete: permission("bookings"),
    },
  },
  seatHolds: { allow: { view: "true", create: "false", update: "false", delete: `(auth.id in data.ref('user.id') || ${permission("bookings")})` } },
  tickets: {
    allow: {
      view: `(auth.id in data.ref('booking.customer.id') || ${permission("bookings")})`,
      create: permission("bookings"), update: permission("bookings"),
      delete: `(${permission("bookings")} || (auth.id in data.ref('booking.customer.id') && 'cancelled' in data.ref('booking.status')))`,
    },
  },
  payments: {
    allow: {
      view: `(auth.id in data.ref('booking.customer.id') || ${permission("payments")})`,
      create: permission("payments"), update: permission("payments"), delete: admin,
    },
  },
  refunds: { allow: { view: permission("payments"), create: permission("payments"), update: permission("payments"), delete: admin } },
  subscriptions: { allow: { view: memberOrAdmin, create: admin, update: admin, delete: admin } },

  notifications: {
    allow: {
      view: `(auth.id in data.ref('user.id') || ${memberOrAdmin})`,
      create: authed, update: memberOrAdmin, delete: memberOrAdmin,
    },
  },
  auditLogs: { allow: { view: memberOrAdmin, create: authed, update: "false", delete: "false" } },

  // Platform analytics — admins read everyone; a user writes only their own row.
  visits: { allow: { view: admin, create: authed, update: `(${admin} || auth.id == data.userId)`, delete: admin } },

  // Anonymous visitor counter: server-only writes, platform admins read.
  siteVisits: { allow: { view: admin, create: "false", update: "false", delete: "false" } },

  // Feedback creation is server-only so validation, spam checks and verified
  // booking ownership cannot be bypassed by a direct client transaction.
  productFeedbacks: { allow: { view: admin, create: "false", update: admin, delete: admin } },
  tripReviews: { allow: { view: memberOrAdmin, create: "false", update: admin, delete: admin } },

  // Provider secrets are readable by members/admins but writable only through the server.
  coopSecrets: { allow: { view: permission("settings"), create: "false", update: "false", delete: "false" } },
} satisfies InstantRules;

export default rules;
