# Cooperative Plus — Monorepo Structure

**pnpm workspaces + Turborepo.** One Next.js web app (admin + cooperative + client surfaces) deploys to **one Vercel project**. Expo mobile app. Shared packages. API is **Hono RPC** (not REST), layered router → controller → service → repository, mounted inside Next.js — no separate API service to deploy.

```
cooperative-plus/
├─ package.json            # workspaces + turbo scripts
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.base.json
├─ .env.example
│
├─ packages/
│  ├─ db/                  # @cp/db — Drizzle schema + Neon client
│  │  ├─ src/schema.ts
│  │  ├─ src/index.ts
│  │  └─ drizzle.config.ts
│  ├─ validation/          # @cp/validation — Zod schemas (shared web+mobile+api)
│  ├─ auth/                # @cp/auth — Better Auth config
│  └─ api/                 # @cp/api — Hono RPC app (factory + layered modules)
│     └─ src/
│        ├─ factory.ts        # Hono factory + typed Env + middleware (auth/tenant/rbac)
│        ├─ index.ts          # composes routers → exports `app` + `AppType`
│        ├─ client.ts         # hc<AppType> RPC client (web + mobile import this)
│        ├─ lib/errors.ts
│        └─ modules/
│           ├─ public/        # search + trips (anonymous)
│           │  ├─ public.router.ts      # paths + zValidator + middleware
│           │  ├─ public.controller.ts  # Context → service → JSON
│           │  ├─ public.service.ts     # business rules
│           │  └─ public.repository.ts  # Drizzle queries
│           ├─ booking/       # holds + confirm (seat-safety)
│           │  ├─ booking.router.ts
│           │  ├─ booking.controller.ts
│           │  ├─ booking.service.ts
│           │  └─ booking.repository.ts
│           ├─ coop/          # back office (tenant + capability gated)
│           └─ admin/         # platform admin (global)
│
├─ apps/
│  ├─ web/                 # @cp/web — Next.js App Router (the Vercel deploy)
│  │  ├─ vercel.ts            # crons (materialize, expire-holds, notif, reconcile)
│  │  ├─ next.config.ts       # transpilePackages: @cp/*
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ (public)/      # client surface — landing, search, checkout
│  │     │  ├─ (coop)/[coopSlug]/  # cooperative dashboard
│  │     │  ├─ (admin)/admin/      # platform admin
│  │     │  ├─ api/
│  │     │  │  ├─ [[...route]]/route.ts   # mounts whole Hono app (one fn)
│  │     │  │  └─ auth/[...all]/route.ts  # Better Auth (more specific, wins)
│  │     │  ├─ layout.tsx
│  │     │  └─ globals.css     # Laterite design system (Tailwind v4 @theme)
│  │     ├─ components/        # ui.tsx, search-bar.tsx, dashboard-shell.tsx
│  │     └─ lib/               # rpc.ts (typed client), cn.ts
│  │
│  └─ mobile/              # @cp/mobile — Expo + expo-router + NativeWind
│     ├─ app.json
│     ├─ babel.config.js      # nativewind + reanimated plugin
│     ├─ metro.config.js      # withNativeWind + monorepo watchFolders
│     ├─ tailwind.config.js   # Laterite palette + fonts
│     ├─ global.css
│     ├─ app/
│     │  ├─ _layout.tsx        # QueryClient + SafeArea + Stack
│     │  ├─ index.tsx          # search home (reanimated entrances)
│     │  └─ results.tsx        # trip list + seat grid
│     └─ src/
│        ├─ lib/api.ts         # createClient(EXPO_PUBLIC_API_URL) — same AppType
│        └─ components/ui.tsx  # react-native-reusables–style (cva + cn + NativeWind)
│
└─ docs/                   # this design set
```

## Layered API (per module)

| Layer | File | Responsibility |
|---|---|---|
| **Router** | `*.router.ts` | Hono paths, `zValidator`, middleware (`withSession`, `withTenant`, `requireCapability`). Chained → enables RPC type inference. |
| **Controller** | `*.controller.ts` | `factory.createHandlers` — read Context (validated input + `cooperativeId`/`userId`), call service, shape `c.json`. |
| **Service** | `*.service.ts` | Business rules, transactions, domain errors. Framework-agnostic, unit-testable. |
| **Repository** | `*.repository.ts` | Drizzle queries only. Tenant-scoped. No business logic. |

## RPC end-to-end typing
`@cp/api` exports `AppType`. Web (`lib/rpc.ts`) and mobile (`src/lib/api.ts`) both call `createClient()` → `hc<AppType>`. Request/response types flow automatically; no codegen, no manual fetch.

```ts
const res = await api.api.search.trips.$get({ query: { origin, destination, date, passengers } });
const { data } = await res.json(); // typed
```

## Deploy (Vercel — trivial)
- **Web:** one Vercel project, **Root Directory = `apps/web`**, framework preset Next.js. Turborepo auto-detected. Hono + Better Auth ride inside the same deployment (`/api/*`). Crons declared in `apps/web/vercel.ts`.
- **DB:** Neon; preview branches per PR.
- **Mobile:** EAS Build; `EXPO_PUBLIC_API_URL` points at the deployed web domain.

```
pnpm i → set env (DATABASE_URL, BETTER_AUTH_SECRET…) → pnpm db:migrate → deploy apps/web to Vercel
```
