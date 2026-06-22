"use client";
import { init } from "@instantdb/react";
import schema from "@cp/instant/schema";

// Realtime client — used in Client Components via db.useQuery / db.transact / db.useAuth.
export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
});

export { id, lookup, tx } from "@instantdb/react";
export type { AppSchema } from "@cp/instant/schema";
