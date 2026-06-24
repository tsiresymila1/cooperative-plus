"use client";
import { hc } from "hono/client";
// Type-only import — the router (and adminDb) is erased from the client bundle.
import type { AppType } from "./router";

/** Typed RPC client for the coop server API. Same-origin (relative).
 * Routes live under /api, so we expose the `.api` sub-client → callers use
 * `api.auth.password.$post`, `api.team.assistant.$post`. */
export const api = hc<AppType>("").api;
