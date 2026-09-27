# Testing architecture

> Owns stable test layout, runner responsibilities, and service boundaries.

## Module layout

- Root Vitest configuration discovers unit tests colocated as `*.test.ts` and integration tests as `*.integration.test.ts`.
- `tests/e2e/` owns Playwright configuration helpers and web smoke specifications.
- `apps/mobile/.maestro/` owns Android YAML flows.
- `scripts/` may contain repository-level validation utilities used by gates and CI.
- `.github/workflows/` owns continuous-integration orchestration.

## Boundaries (what may import what)

- Unit tests import pure modules directly and run in Node.
- Integration tests exercise Hono request/response contracts and fake provider modules at the boundary.
- Browser tests interact only through rendered UI and accessible selectors.
- Maestro interacts only through the installed Android application UI.

## Provider / service wiring

- Vitest provides assertions, fake timers, and module boundary fakes.
- Playwright starts the three local Next.js applications through configured web servers and retains traces/screenshots on failure.
- Maestro runs against Android package `ts.mila.cooperativeplus`; a repository validator checks flow structure when no device is available.

## Data flow

- Unit fixtures stay in process.
- Integration inputs enter through HTTP requests and terminate at faked external boundaries.
- Initial E2E flows remain read-only and unauthenticated; seeded authenticated journeys require a future isolated InstantDB test environment.
