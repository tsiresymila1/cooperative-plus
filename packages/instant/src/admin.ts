import { init, id, lookup } from "@instantdb/admin";
import schema from "./schema";

/** Server-side privileged client (Hono routes, cron, webhooks, seed). */
export const adminDb = init({
  appId: process.env.INSTANT_APP_ID ?? process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
  schema,
});

export { id, lookup };
export { default as schema } from "./schema";
export type { AppSchema } from "./schema";
