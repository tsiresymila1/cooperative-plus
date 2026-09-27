# Testing requirements

> Owns product-level test behaviour, security rules, external contracts, and hard constraints.

## What the product must do

- The monorepo must expose repeatable commands for unit, integration, browser E2E, and Android Maestro testing.
- Critical validation, encryption, password, seat-layout, date/status, authentication-validation, and payment-boundary behaviour must have happy-path and primary-failure coverage.
- Each web application must have a headless smoke test for its public/login entry point and a validation or access-control assertion.
- The Android application must have Maestro flows for onboarding, sign-in visibility, invalid email handling, and keyboard-safe access to the primary action.

## User-visible behaviour

- Tests must verify the existing French labels and accessible actions without changing product behaviour solely for test convenience.
- Stable accessibility identifiers may be added when visible text is not a reliable selector.
- Failure artifacts must make browser and mobile regressions diagnosable.

## API contracts

- Local HTTP contract tests must assert status codes and error payloads for malformed or unauthorized requests.
- External authentication, database, observability, and payment providers are boundaries and must not receive traffic from unit or integration tests.

## Security / data rules · roles · permissions

- No test may use production accounts, production data, live payment credentials, or committed secrets.
- Test fixtures must contain synthetic identities and deterministic local data only.
- Protected coop and admin routes must retain their authentication and authorization boundaries.

## Constraints (never do)

- Never edit `.env`, rotate or commit secrets, deploy, push, rewrite Git history, or connect test automation to production.
- Never disable a failing test, lower a gate, add `@ts-ignore`, or rely on arbitrary sleeps to force success.
- Never make destructive database calls from the test suite.
