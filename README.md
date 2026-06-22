# Cooperative Plus

Multi-tenant SaaS for *taxi-brousse* cooperatives — manage routes, vehicles, recurring trips, bookings, payments, and customers; customers search/book/pay on web + mobile.

**Monorepo:** pnpm + Turborepo. Web (admin + cooperative + client) = one Next.js app → one Vercel project. Mobile = Expo.

**Stack:** Next.js App Router · TypeScript · **Hono RPC** (layered router→controller→service→repository, mounted in Next.js) · Better Auth · PostgreSQL (Neon) · Drizzle ORM · Tailwind v4 · React Query · Zod · Vercel · **Expo + NativeWind + react-native-reusables + Reanimated** (mobile).

**Design:** "Laterite Departure Board" — Madagascar red-earth palette, Clash Display + Satoshi + Spline Sans Mono, departure-board motion.

## Workspace layout

```
packages/  db · validation · auth · api(Hono RPC)
apps/      web(Next.js, the Vercel deploy) · mobile(Expo)
```

## Run

```bash
pnpm i
cp .env.example .env        # set DATABASE_URL, BETTER_AUTH_SECRET, ...
pnpm db:generate && pnpm db:migrate
pnpm web                    # Next.js  → http://localhost:3000
pnpm mobile                 # Expo
```

Deploy web: Vercel project, **Root Directory = `apps/web`**, preset Next.js. Done.

## Design deliverables

| # | Deliverable | File |
|---|---|---|
| 1 | Product Requirements (PRD) | [docs/01-PRD.md](docs/01-PRD.md) |
| 2 | Database schema (logical) | [docs/02-DATABASE-SCHEMA.md](docs/02-DATABASE-SCHEMA.md) |
| 3 | Drizzle schema (code) | [src/db/schema.ts](src/db/schema.ts) |
| 4 | RBAC matrix | [docs/03-RBAC.md](docs/03-RBAC.md) |
| 5 | API specification | [docs/04-API-SPEC.md](docs/04-API-SPEC.md) |
| 6 | User flows | [docs/05-USER-FLOWS.md](docs/05-USER-FLOWS.md) |
| 7 | System architecture | [docs/06-ARCHITECTURE.md](docs/06-ARCHITECTURE.md) |
| 8 | Next.js folder structure | [docs/07-FOLDER-STRUCTURE.md](docs/07-FOLDER-STRUCTURE.md) |
| 9 | Dashboard wireframes | [docs/08-WIREFRAMES.md](docs/08-WIREFRAMES.md) |
| 10–13 | Roadmap, subscription, monetization | [docs/09-ROADMAP-MONETIZATION.md](docs/09-ROADMAP-MONETIZATION.md) |

## Core design decisions
- **Tenancy:** single shared DB, row isolation by `cooperativeId`, optional Postgres RLS for defense-in-depth.
- **Seat safety:** double-booking impossible via DB unique constraints on `(trip_instance_id, seat_label)` for holds + tickets — not app logic.
- **Holds:** 5-min seat hold, lazy + cron expiry sweep.
- **Money:** integer minor units + `currency` column everywhere.
- **Shared service layer:** Server Actions (web) and `/api/v1` (mobile) call the same `lib/services` functions.
- **Cash never taxed:** transaction fees apply to online payments only.
```
