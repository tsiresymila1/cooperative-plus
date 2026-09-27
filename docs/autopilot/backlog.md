# Testing backlog

> Owns sequencing, exact implementation slices, and remaining gaps.

## Milestones / sequencing

1. Establish executable test tooling and shared unit coverage.
2. Cover mobile domain and provider-boundary logic.
3. Cover local HTTP validation contracts.
4. Add Playwright smoke coverage for all web applications.
5. Add Maestro Android flows and validate their structure.
6. Run headless layers in CI and document device verification.

## Tasks (autopilot derives its queue from this)

- [x] `test-001`: Vitest foundation plus shared validation tests.
- [x] `test-002`: Cryptography, password, subscription, and mobile-domain unit tests.
- `test-003`: Mobile payment boundaries plus Hono HTTP contract integration tests.
- `test-004`: Playwright client/coop/admin smoke and validation tests.
- `test-005`: Maestro onboarding and sign-in Android flows with stable accessibility identifiers.
- `test-006`: CI orchestration, complete test documentation, and final full-suite gate.

## Known gaps

- Authenticated booking, payment completion, coop operations, and admin mutation E2E flows need an isolated InstantDB project with resettable seed data.
- Google account selection and real payment-provider completion remain provider-owned manual tests.
- Maestro execution requires a running Pixel-class Android emulator or device with the development build installed.
