import "react-native-get-random-values";
import { init, id, lookup, type InstaQLEntity, type TransactionChunk } from "@instantdb/react-native";
import schema, { type AppSchema } from "@cp/instant/schema";

const appId = process.env.EXPO_PUBLIC_INSTANT_APP_ID as string;

if (!appId) {
  // Helpful crash in dev rather than silent empty queries.
  console.warn("[db] EXPO_PUBLIC_INSTANT_APP_ID is not set");
}

export const db = init({ appId, schema });

export { id, lookup };
export type DB = typeof db;

// Heterogeneous transaction chunk (mixed entities in one db.transact([...])).
export type Chunk = TransactionChunk<any, any>;

// Convenience entity types
export type TripInstance = InstaQLEntity<AppSchema, "tripInstances">;
export type Destination = InstaQLEntity<AppSchema, "destinations">;
export type Booking = InstaQLEntity<AppSchema, "bookings">;
export type Ticket = InstaQLEntity<AppSchema, "tickets">;
export type SeatHold = InstaQLEntity<AppSchema, "seatHolds">;
export type Cooperative = InstaQLEntity<AppSchema, "cooperatives">;
export type CPUser = InstaQLEntity<AppSchema, "$users">;
