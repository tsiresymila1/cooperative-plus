# Feature Specification: Testing Foundation

**Feature Branch**: `main`  
**Created**: 2026-09-27  
**Status**: In progress

## User Scenarios & Testing

### User Story 1 — Fast regression feedback (Priority: P1)

As a developer, I can run deterministic unit and integration tests locally so business-rule regressions are detected before deployment.

**Independent Test**: Run the root unit and integration commands on a machine without production credentials; both suites complete without external traffic.

**Acceptance Scenarios**:

1. Given valid and invalid schema data, when unit tests run, then accepted values and rejected boundaries are both proven.
2. Given cryptographic, password, seat-layout, and payment helpers, when their primary success and failure cases run, then results are deterministic and failures are explicit.
3. Given malformed or unauthorized HTTP requests, when integration tests call local handlers, then status and error contracts are asserted without provider access.

### User Story 2 — Web journey confidence (Priority: P1)

As a maintainer, I can run browser smoke tests for client, cooperative, and admin applications and receive useful failure artifacts.

**Independent Test**: Run Playwright Chromium against the three locally started applications and verify every project passes.

**Acceptance Scenarios**:

1. Given the public client, when a visitor opens search and sign-in entry points, then critical controls and browser validation are usable.
2. Given the cooperative and admin applications, when an unauthenticated visitor opens sign-in or protected entry points, then authentication controls or access protection are visible.
3. Given a browser failure, when the run finishes, then trace and screenshot settings retain actionable artifacts.

### User Story 3 — Android journey confidence (Priority: P2)

As a mobile maintainer, I can run Maestro flows on a Pixel-class Android development build for onboarding and sign-in regressions.

**Independent Test**: Install the development build, run the committed Maestro suite, and observe all flows complete without hidden or inaccessible actions.

**Acceptance Scenarios**:

1. Given a fresh app state, when onboarding completes, then the home search action is visible.
2. Given the sign-in screen, when it opens, then Google and email choices are visible.
3. Given an invalid email and an open keyboard, when submission occurs, then validation appears and the primary action remains reachable.

### Edge Cases

- Missing, malformed, minimum, maximum, and over-limit schema values.
- Missing encryption key, malformed encrypted value, wrong password, and corrupted hash.
- Missing or malformed seat snapshots and zero-seat fallbacks.
- Rejected network calls, malformed provider responses, and dismissed hosted payment pages.
- Small Android viewport with software keyboard open.
- Browser applications started without production credentials.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST provide named commands for unit, integration, web E2E, and Maestro execution.
- **FR-002**: Each critical unit path MUST include a happy path and primary failure or boundary case.
- **FR-003**: Unit and integration suites MUST NOT call production services.
- **FR-004**: Playwright MUST cover all three web applications with accessible selectors and failure artifacts.
- **FR-005**: Maestro MUST cover onboarding and sign-in behavior for Android package `ts.mila.cooperativeplus`.
- **FR-006**: Headless test layers MUST run in continuous integration.
- **FR-007**: Authenticated destructive flows MUST remain out of scope until an isolated resettable test backend exists.

## Assumptions

- Existing visible French copy is stable enough for initial smoke selectors.
- The local `.env` may support application startup, but tests do not inspect or commit it.
- A Pixel-class emulator or device and Android development build are available for manual Maestro verification.

## Success Criteria

- **SC-001**: A single root command completes all deterministic unit and integration tests with zero production traffic.
- **SC-002**: The web smoke suite covers client, cooperative, and admin applications in Chromium and produces diagnostics on failure.
- **SC-003**: The Maestro suite contains independently runnable onboarding and sign-in flows for the Android development build.
- **SC-004**: Every autonomous implementation slice has a passing executable gate and independent review.
