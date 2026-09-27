# Test strategy

> Owns coverage layers, risk scenarios, expected gates, and verification gaps.

## What must be tested

- Unit: schemas and boundaries, cryptographic round trips and corruption, password verification, seat maps, dates, countdowns, statuses, and payment result mapping.
- Integration: malformed/unauthorized Hono requests and provider failures without live network or database traffic.
- E2E web: client search and sign-in entry points, coop password sign-in/reset entry points, admin sign-in and protected-route behavior.
- E2E mobile: first launch/onboarding, sign-in entry, Google action visibility, invalid email feedback, and keyboard-safe primary actions.

## Risk scenarios

- Boundary values silently accepted by shared Zod schemas.
- Encrypted values becoming unrecoverable or malformed values crashing services.
- Mobile fallback seat maps producing wrong seat counts or labels.
- External payment/auth failures leaving misleading UI state.
- Login controls disappearing or being obscured on small Android screens.
- Private web pages rendering without authentication.

## Expected gates per task class

- Tooling and unit tasks: targeted Vitest command plus TypeScript typecheck.
- Integration tasks: targeted Vitest integration command plus full unit suite.
- Web E2E tasks: Playwright Chromium suite against local servers.
- Maestro tasks: flow-structure validation; real-device execution is recorded as manual verification when unavailable.
- CI/final task: unit, integration, Playwright, typecheck, and production build gates all pass.

## Verification gaps

- Live Google OAuth, email delivery, InstantDB production permissions, Sentry ingestion, and PAPI settlement are not automated in local tests.
- Android device-specific rendering is not proven until the committed Maestro suite is executed on the development build.
