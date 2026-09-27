# Cooperative Plus testing constitution

## Core principles

### I. Confidence before coverage
Tests cover business risks and observable behavior; coverage percentage is not a target by itself.

### II. Deterministic isolation
Unit and integration suites never contact production providers or depend on execution order.

### III. Layer discipline
Pure logic is tested with Vitest, local HTTP contracts at integration level, critical web journeys with Playwright, and Android journeys with Maestro.

### IV. Executable gates
Every implementation slice has a command that fails when its promised behavior is missing.

### V. Accessible automation
UI automation uses roles, labels, visible text, or explicit accessibility identifiers instead of styling or fragile DOM structure.

## Security and scope

No production account, secret, data mutation, payment, deployment, push, or Git history rewrite is permitted during autonomous test work.

## Development workflow

Every task is scope checked, gated, independently reviewed, documented, and committed forward. Tests may not be skipped or weakened to obtain green output.

## Governance

This constitution governs the testing-foundation feature and must stay consistent with `docs/autopilot/requirements.md` and `docs/autopilot/test-strategy.md`.

**Version**: 1.0.0 | **Ratified**: 2026-09-27 | **Last Amended**: 2026-09-27
