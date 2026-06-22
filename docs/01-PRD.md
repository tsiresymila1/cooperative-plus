# Cooperative Plus — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Production-ready specification
**Last updated:** 2026-06-19

---

## 1. Overview

Cooperative Plus is a **multi-tenant SaaS** transportation booking platform built for *taxi-brousse* cooperatives (primarily Madagascar / francophone-African market). It centralizes route, vehicle, schedule, reservation, payment, and customer management for many cooperatives on a single platform, while keeping each cooperative's data strictly isolated.

End customers search trips, reserve seats, pay online, and manage bookings through a web portal and a Flutter mobile app.

### 1.1 Problem statement

Taxi-brousse cooperatives operate manually: paper ledgers, phone reservations, cash-only payments, no occupancy visibility, frequent double-bookings, and no customer reach beyond the station. There is no shared digital infrastructure they can afford individually.

### 1.2 Solution

A subscription SaaS where each cooperative gets a managed back office (routes, vehicles, recurring trips, bookings, payments, reports) plus a public-facing booking surface (web + mobile) that customers across all cooperatives can search. The platform operator monetizes via subscriptions + optional transaction fees.

### 1.3 Goals (first 12 months)

| Goal | Metric | Target |
|---|---|---|
| Onboard cooperatives | Active paying cooperatives | 50 |
| Drive online bookings | % bookings created via customer self-service | 35% |
| Reduce no-shows / double-bookings | Seat-conflict incidents | < 0.5% of bookings |
| Online payment adoption | % paid bookings via Mobile Money / card | 40% |
| Platform reliability | Uptime | 99.9% |

### 1.4 Non-goals (v1)

- Live GPS vehicle tracking on a map (driver location streaming).
- Dynamic / surge pricing engine.
- Loyalty / points program.
- Multi-currency (launch is single currency: MGA, configurable per environment).
- Freight / parcel logistics (passenger seats only).

---

## 2. Personas

| Persona | Goal | Pain today | Key features |
|---|---|---|---|
| **Platform Admin** (operator staff) | Grow & operate the platform | No tooling, support is manual | Cooperative CRUD, suspension, plans, global destinations, platform stats |
| **Cooperative Owner** | Run their transport business | Paper chaos, no reports | Profile, vehicles, routes, recurring trips, bookings, payments, reports, assistants |
| **Cooperative Assistant** (station clerk) | Sell & manage seats fast | Manual ledger, errors | Create/cancel bookings, check-in, cash payments — scoped by RBAC |
| **Client** (passenger) | Get a seat reliably | Calling stations, no proof | Search, seat select, pay, history, notifications |
| **Anonymous visitor** | Quick one-off booking | Forced signup elsewhere | Guest booking by phone/email |

---

## 3. Functional requirements

### 3.1 Cooperative management
- FR-COOP-1: Platform Admin creates a cooperative with name, slug, owner email; system provisions an Owner account and sends an invite.
- FR-COOP-2: Owner edits profile: legal name, logo, contact (phone/email/address), working hours, social links.
- FR-COOP-3: Cooperative has a `subscriptionStatus` (`trialing | active | past_due | suspended | cancelled`) gating feature access.
- FR-COOP-4: Platform Admin can suspend/reactivate a cooperative; suspension blocks all writes for that tenant but preserves data.
- FR-COOP-5: Platform Admin can trigger a password reset for any cooperative user.

### 3.2 Vehicle management
- FR-VEH-1: CRUD vehicles: registration number (unique per cooperative), display name, vehicle type (`minibus_15 | minibus_18 | bus_30 | custom`), seat count, status (`active | maintenance | retired`), notes.
- FR-VEH-2: **Visual seat configuration** — a seat map (rows × columns) with each cell typed `seat | aisle | door | driver | empty`. Seats carry a label (e.g. `1A`). Seat count is derived from map seats. Presets for 15/18/30.
- FR-VEH-3: Seat map versioned; changing a map does not retroactively alter already-booked trip instances (instances snapshot the layout).

### 3.3 Destination management
- FR-DEST-1: Global destinations owned by Platform Admin: name, region, country, GPS lat/lng, `isPopular`.
- FR-DEST-2: Cooperatives may add private destinations (scoped) if not in the global list; admin can promote them to global.
- FR-DEST-3: Autocomplete search by name/region with popularity boost.

### 3.4 Route management
- FR-ROUTE-1: A route = origin destination + destination destination + cooperative. Optional intermediate stops (ordered).
- FR-ROUTE-2: Base price per route; optional per-segment pricing for stops; optional price tiers (e.g. front seat premium).
- FR-ROUTE-3: Estimated distance (km) and duration (min).

### 3.5 Trip management
- FR-TRIP-1: Create a **trip template** with recurrence: `one_time | daily | weekly | monthly | custom (RRULE)`.
- FR-TRIP-2: Template carries: route, vehicle, driver info (name, phone, license), departure time, arrival estimate, price overrides, notes, excluded dates.
- FR-TRIP-3: A scheduler **materializes trip instances** for a rolling horizon (default 60 days). Each instance snapshots route, price, seat map, vehicle.
- FR-TRIP-4: Editing a template offers scope: *this instance | this and future | all future*. Past instances immutable.
- FR-TRIP-5: Instance status: `scheduled | boarding | departed | arrived | cancelled`.

### 3.6 Booking management
- FR-BOOK-1: Booking sources: `anonymous | customer | cooperative` (staff-created).
- FR-BOOK-2: Workflow: select seats select temporary hold (5 min) collect passenger info pay confirm.
- FR-BOOK-3: **Seat lock** — selecting a seat creates a `hold` row with `expiresAt = now + 5min`; seat unavailable to others while held. A scheduled job + lazy check releases expired holds.
- FR-BOOK-4: Confirmed booking has a unique reference code (e.g. `CP-7F3K9Q`) and per-seat ticket entries.
- FR-BOOK-5: Cancellation rules configurable per cooperative (cutoff hours, refund %).
- FR-BOOK-6: Check-in marks passenger boarded; supports partial check-in.
- FR-BOOK-7: Overbooking prevented by DB unique constraint on `(tripInstanceId, seatLabel)` for active holds/bookings.

### 3.7 Payments
- FR-PAY-1: Methods: `cash | mobile_money | card`. Mobile Money via provider (MVola/Orange Money/Airtel) gateway abstraction; card via Stripe.
- FR-PAY-2: Status: `pending | paid | failed | refunded | partially_refunded`.
- FR-PAY-3: Payment proof upload (image/PDF) for offline/manual payments (Vercel Blob).
- FR-PAY-4: Webhooks reconcile gateway state; idempotent by provider reference.
- FR-PAY-5: Refunds recorded with reason and actor; cash refunds are manual-marked.

### 3.8 Customer portal
- FR-CUST-1: Search trips by origin, destination, date, passengers; filter by price, departure window, cooperative, seats available, vehicle type.
- FR-CUST-2: Seat selection on the visual map.
- FR-CUST-3: Booking & payment history; downloadable ticket (PDF/QR).
- FR-CUST-4: Profile management; saved passengers.

### 3.9 Notifications
- FR-NOTIF-1: Channels: email (Resend), SMS (provider abstraction), push (FCM for mobile).
- FR-NOTIF-2: Events: booking_created, booking_confirmed, booking_cancelled, trip_reminder (T-2h, configurable), payment_received, payment_failed, trip_cancelled_by_coop.
- FR-NOTIF-3: Per-user channel preferences; transactional always-on for confirmations.
- FR-NOTIF-4: Outbox pattern — notifications enqueued in DB, delivered by a worker; retries with backoff.

### 3.10 Dashboards
- Admin: revenue (platform fees + subscriptions), cooperative count/status, active bookings, active users, MRR, churn.
- Cooperative: today's departures, occupancy rate, revenue (day/week/month), upcoming trips, booking funnel stats.

---

## 4. Non-functional requirements

| Area | Requirement |
|---|---|
| **Multi-tenancy** | Every tenant row carries `cooperativeId`. All queries scoped by middleware-injected tenant context. Defense-in-depth: optional Postgres RLS policies. |
| **Security** | Better Auth sessions, RBAC enforced server-side in every Server Action, CSRF protection, rate limiting on auth & booking endpoints, BotID on public search/booking. |
| **Audit** | Append-only `audit_log` for all mutating admin/owner/assistant actions. |
| **Soft deletes** | `deletedAt` on all business entities; queries filter it out. |
| **Performance** | Trip search P95 < 400ms; seat-map render < 100ms. Indexed search columns. |
| **Availability** | 99.9% uptime; Neon autoscaling; stateless functions on Vercel Fluid Compute. |
| **Concurrency** | Seat allocation race-safe via unique constraints + transactional holds. |
| **i18n** | FR + MG + EN. Currency/locale formatting. |
| **Accessibility** | WCAG 2.1 AA on customer-facing surfaces. |
| **Observability** | Structured logs, error tracking, payment reconciliation alerts. |
| **Compliance** | PII minimization, payment data never stored (tokenized), GDPR-style export/delete on request. |

---

## 5. Success metrics / KPIs

- MRR, ARPU per cooperative, churn rate.
- Online-booking share, payment-method mix.
- Occupancy rate uplift vs. baseline.
- Seat-conflict rate (must stay < 0.5%).
- Notification delivery rate.

## 6. Assumptions & constraints

- Single currency per deployment (MGA default), but money stored as integer minor units + `currency` column for future-proofing.
- Mobile Money APIs vary by country/operator — abstracted behind a provider interface; first integration is the dominant local operator.
- Many cooperatives have low-bandwidth users — mobile app and web must work on slow 3G; aggressive caching, small payloads.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Mobile Money gateway instability | Idempotent webhooks, manual proof-upload fallback, reconciliation job |
| Seat double-booking under load | DB unique constraint is source of truth, not app logic |
| Cooperative resistance to digital | Cash-first workflow preserved; assistant UI optimized for speed |
| Tenant data leak | Tenant context middleware + RLS + audit + tests asserting scoping |
