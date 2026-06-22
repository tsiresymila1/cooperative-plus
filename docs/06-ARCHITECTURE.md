# Cooperative Plus — System Architecture

> **UPDATE (monorepo + Hono RPC):** The platform is a **pnpm/Turborepo monorepo**. The web app (admin + cooperative + client) is **one Next.js app deployed to one Vercel project**. The API is **Hono RPC** (typed `hc` client, not REST + not Server Actions for data), layered **router → controller → service → repository** per module, mounted inside Next.js at `/api/[[...route]]`. Mobile is **Expo + expo-router + NativeWind** (react-native-reusables components, reanimated). Web and mobile import the **same `AppType`** for end-to-end typed RPC. See `docs/07-FOLDER-STRUCTURE.md`. The REST tables in `docs/04-API-SPEC.md` now describe the equivalent Hono routes (`api.api.<group>.<path>.$get/$post`).

## High-level
```
                         ┌─────────────────────────────────────────────┐
   Customers (web)  ─────▶│  Next.js App Router (Vercel, Fluid Compute)  │
   Flutter mobile  ──────▶│  ┌─────────────┬──────────────┬───────────┐ │
   Cooperative staff ────▶│  │ RSC / Pages │ Server Actions│ /api/v1   │ │
   Platform admin ───────▶│  └─────────────┴──────────────┴───────────┘ │
                          │        Routing Middleware (tenant resolve)   │
                          └───────┬──────────────────┬──────────────────┘
                                  │ service layer     │ background
                          ┌───────▼─────────┐  ┌──────▼───────────┐
                          │ Drizzle ORM     │  │ Vercel Cron jobs │
                          │  ▼              │  │ - materialize    │
                          │ Neon Postgres   │  │ - expire holds   │
                          │ (RLS optional)  │  │ - notif worker   │
                          └─────────────────┘  │ - reconcile pay  │
                                               └──────────────────┘
   External: Stripe (card) · MoMo gateways (MVola/Orange/Airtel) ·
             Resend (email) · SMS provider · FCM (push) · Vercel Blob (files)
```

## Layers
1. **Edge / Middleware** — Routing Middleware resolves tenant (slug subdomain or path), attaches request context, enforces suspension, rate-limits, BotID on public surfaces.
2. **Presentation** — RSC for reads (cacheable), Client Components for interactive (seat map, search filters) using React Query for client-side cache + optimistic updates.
3. **Application / Server Actions + API handlers** — thin: `auth → zod validate → service → revalidate`. Same service functions back both Actions and REST.
4. **Domain / services** (`lib/services/*`) — business rules: booking, holds, pricing, scheduling, payments, notifications. Pure, testable, tenant-aware.
5. **Data** — Drizzle repositories; all tenant queries take `cooperativeId`. Transactions for seat allocation.
6. **Background** — Vercel Cron + Queues for materialization, hold expiry, notification delivery, payment reconciliation.

## Multi-tenancy strategy
- **Single shared DB, row-level isolation** by `cooperativeId` (cheapest, scales to thousands of small tenants).
- Tenant context injected once per request; repositories require it.
- **Defense in depth:** optional Postgres RLS using `SET LOCAL app.cooperative_id` per transaction so even a missing app-layer filter cannot leak.
- Platform admin uses an explicit "act as / global" mode that bypasses tenant filter with audit.

## Seat concurrency (the hard part)
- Source of truth = DB unique constraints, not app logic.
- `seat_hold` unique `(trip_instance_id, seat_label)` + `ticket` unique `(trip_instance_id, seat_label)`.
- Hold creation: single `INSERT ... ON CONFLICT DO NOTHING`; 0 rows = seat taken → 409.
- Booking confirm: transaction validates holds belong to caller & unexpired, inserts tickets, increments `seatsBooked`, deletes holds.
- Expiry: lazy (filtered out by `expiresAt > now()`) + cron sweep deletes stale rows.

## Payments
- Provider-agnostic interface `PaymentGateway { createCharge, verifyWebhook, refund }`.
- Implementations: Stripe (card), MoMo adapters (MVola/Orange/Airtel), Manual (cash/proof).
- Webhooks idempotent via unique `provider_ref`. Reconciliation cron catches missed webhooks.
- Platform transaction fee applied per plan `transactionFeeBps` on online payments.

## Caching
- Next.js Cache Components: `use cache` on public trip search/detail, tagged `trips:{routeId}` / `instance:{id}`; `updateTag` on booking/cancel/instance change.
- React Query on client for back-office lists with background refetch.
- Vercel Runtime Cache for hot destination autocomplete.

## Observability & ops
- Structured logging w/ request id + tenant id.
- Error tracking (Sentry-style).
- Payment reconciliation alerts; notification failure alerts.
- Audit log queryable per tenant.

## Security
- Better Auth sessions (cookie web, bearer mobile), OTP for phone.
- RBAC server-side everywhere; never trust client role.
- CSRF on Actions, signed webhooks, rate limits, Vercel WAF + BotID.
- PII minimized; no raw card data (tokenized); secrets in Vercel env.

## Environments
- Neon branching: `main` (prod) + per-PR preview branches (ephemeral DB) auto-provisioned.
- Vercel preview deploys per PR wired to preview DB branch.
- Migrations via Drizzle Kit in CI before promote.
```
Repo → PR → Vercel Preview + Neon branch → drizzle migrate → e2e → merge → prod promote (rolling release)
```
