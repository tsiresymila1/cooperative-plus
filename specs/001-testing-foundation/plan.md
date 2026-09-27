# Implementation Plan: Testing Foundation

## Summary

Introduce a layered testing architecture for the pnpm/Turborepo monorepo: Vitest for deterministic TypeScript unit and Hono integration tests, Playwright Chromium projects for the three Next.js apps, Maestro flows for the Expo Android app, and CI jobs that keep provider-backed journeys isolated from production.

## Technical Context

- Node.js 22, pnpm 9.12, TypeScript 5.7, Turborepo 2.
- Next.js 15 apps on ports 4000–4002 and Expo 55 Android package `ts.mila.cooperativeplus`.
- No existing general-purpose test runner; one standalone subscription assertion script exists.
- External boundaries: InstantDB, Google OAuth, PAPI, Sentry, Vercel, email delivery, and Android device runtime.

## Constitution Check

- Confidence before coverage: tests target shared validation, security helpers, booking helpers, authentication validation, and payment boundaries.
- Deterministic isolation: provider traffic is mocked or excluded from mandatory gates.
- Layer discipline: Vitest, Playwright, and Maestro each own only their intended layer.
- Executable gates: every Autopilot task defines a command that can fail.
- Accessible automation: UI suites use roles, labels, visible copy, and stable accessibility identifiers.

## Project Structure

```text
vitest.config.ts
vitest.integration.config.ts
playwright.config.ts
tests/e2e/
apps/mobile/.maestro/
scripts/validate-maestro.mjs
.github/workflows/test.yml
```

Unit tests remain colocated beside source modules. Integration tests remain beside each Hono router. Durable decisions live under `docs/autopilot/`; detailed reconnaissance lives in `docs/plans/testing-foundation.md`.

## Delivery Strategy

Build the runner and a real validation suite first, then expand pure-domain coverage, HTTP/provider-boundary coverage, browser smoke coverage, Android flows, and CI. Commits are forward-only and each slice is independently gated and reviewed.

## Verification

- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:coverage`
- `pnpm test:e2e`
- `pnpm test:mobile:validate`
- `pnpm typecheck`
- `pnpm build`
