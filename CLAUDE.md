# Cooperative Plus project rules

## Stack

- pnpm 9 workspace managed with Turborepo.
- Next.js 15 and React 19 applications in `apps/client`, `apps/coop`, and `apps/admin`.
- Expo 55 and React Native 0.83 application in `apps/mobile`.
- Shared TypeScript packages live under `packages/`; InstantDB owns persistence and authentication.
- Use `pnpm typecheck`, `pnpm build`, and the root test scripts as repository gates.

## Conventions

- Keep TypeScript strict and use ESM syntax.
- Prefer behavior-focused tests with accessible selectors; do not test framework internals.
- Keep pure business logic in shared or app `src/lib` modules so it can be tested without UI or network access.
- Mock only external service boundaries. Never mock the unit under test.
- Use `apply_patch` for hand-written file edits and `rtk` for shell commands.

## Boundaries

- Unit tests must not connect to InstantDB, Sentry, Google, PAPI, Vercel, or production URLs.
- Integration tests may exercise local Hono handlers but must replace external services with deterministic fakes.
- Playwright smoke tests cover public and validation paths unless a dedicated test backend is configured.
- Maestro targets the Android development build with package id `ts.mila.cooperativeplus`.
- Never read, write, or migrate the legacy `.agent/` directory.
