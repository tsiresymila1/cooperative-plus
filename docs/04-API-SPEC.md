# Cooperative Plus — API Specification

Two interfaces share the same service layer:

- **Server Actions** — primary path for the Next.js web app (mutations + RSC reads). Type-safe, Zod-validated, no manual fetch.
- **REST/JSON API** (`/api/v1/*`) — for the Flutter mobile app, webhooks, and third parties. Bearer token (Better Auth session token or API key).

All mutating endpoints: Zod-validated input, RBAC-checked, tenant-scoped, audited. All money is integer minor units + `currency`. Errors use a consistent envelope.

## Error envelope
```json
{ "error": { "code": "FORBIDDEN", "message": "missing booking.cancel", "details": {} } }
```
Codes: `UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION, CONFLICT, RATE_LIMITED, SEAT_TAKEN, HOLD_EXPIRED, PAYMENT_FAILED, INTERNAL`.

## Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/sign-up` | name,email,phone,password | customer signup |
| POST | `/api/v1/auth/sign-in` | email/phone,password | returns session token |
| POST | `/api/v1/auth/otp/request` | phone | SMS OTP |
| POST | `/api/v1/auth/otp/verify` | phone,code | |
| POST | `/api/v1/auth/sign-out` | — | |
| GET | `/api/v1/me` | — | profile + memberships |

## Public search (anonymous OK, BotID-protected)
| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/v1/search/destinations` | `q` | autocomplete destinations |
| GET | `/api/v1/search/trips` | `origin,destination,date,passengers,priceMin,priceMax,vehicleType,cooperativeId,sort` | paginated trip instances w/ seats available |
| GET | `/api/v1/trips/:instanceId` | — | instance detail + seat map + live availability |
| GET | `/api/v1/trips/:instanceId/seats` | — | seat states: `available|held|booked|blocked` |

## Booking flow
| Method | Path | Body | Auth | Notes |
|---|---|---|---|---|
| POST | `/api/v1/trips/:instanceId/holds` | `seatLabels[]` | session or anon token | creates 5-min holds; 409 `SEAT_TAKEN` |
| DELETE | `/api/v1/holds/:id` | — | holder | release |
| POST | `/api/v1/bookings` | `instanceId, holdIds[], contact{name,phone,email}, passengers[], source` | customer/anon/staff | converts holds confirmed-pending; 409 `HOLD_EXPIRED` |
| GET | `/api/v1/bookings/:ref` | — | owner of booking / staff | detail + tickets + payment |
| PATCH | `/api/v1/bookings/:id` | partial | staff `booking.update` | |
| POST | `/api/v1/bookings/:id/cancel` | `reason` | staff `booking.cancel` / customer(policy) | computes refund |
| POST | `/api/v1/bookings/:id/checkin` | `seatLabels[]` | staff `booking.checkin` | |
| GET | `/api/v1/me/bookings` | `status,page` | customer | history |

## Payments
| Method | Path | Body | Auth | Notes |
|---|---|---|---|---|
| POST | `/api/v1/bookings/:id/pay` | `method, provider` | customer/staff | online: returns gateway redirect/intent; cash: marks pending |
| POST | `/api/v1/payments/:id/cash-confirm` | `amount` | staff `payment.cash.collect` | marks paid |
| POST | `/api/v1/payments/:id/proof` | multipart file | staff/customer | Blob upload → `proof_url` |
| POST | `/api/v1/payments/:id/refund` | `amount,reason` | owner | |
| POST | `/api/webhooks/stripe` | provider payload | sig-verified | idempotent by `provider_ref` |
| POST | `/api/webhooks/momo/:provider` | provider payload | sig-verified | mvola/orange/airtel |

## Cooperative back office (owner / assistant)
| Resource | Endpoints |
|---|---|
| Profile | `GET/PATCH /api/v1/coop` |
| Team | `GET/POST /api/v1/coop/members`, `PATCH/DELETE /api/v1/coop/members/:id` |
| Vehicles | `GET/POST /api/v1/coop/vehicles`, `GET/PATCH/DELETE /:id`, `PUT /:id/seat-map` |
| Destinations | `GET/POST /api/v1/coop/destinations`, `PATCH/DELETE /:id` |
| Routes | `GET/POST /api/v1/coop/routes`, `GET/PATCH/DELETE /:id` (incl. stops) |
| Trip templates | `GET/POST /api/v1/coop/trip-templates`, `PATCH/DELETE /:id` (scope: `instance|future|all`), `POST /:id/exclusions` |
| Trip instances | `GET /api/v1/coop/trips`, `PATCH /:id` (status), `POST /:id/cancel` |
| Bookings | `GET /api/v1/coop/bookings` (filters), `POST` (staff booking) |
| Reports | `GET /api/v1/coop/reports/{revenue,occupancy,bookings}` |
| Dashboard | `GET /api/v1/coop/dashboard` |

## Platform admin
| Resource | Endpoints |
|---|---|
| Cooperatives | `GET/POST /api/v1/admin/cooperatives`, `POST /:id/suspend`, `POST /:id/reactivate`, `POST /:id/reset-password` |
| Plans | `GET/POST/PATCH /api/v1/admin/plans` |
| Global destinations | `GET/POST/PATCH/DELETE /api/v1/admin/destinations`, `POST /:id/promote` |
| Stats | `GET /api/v1/admin/stats` (MRR, churn, bookings, users) |

## Server Action signatures (web)
```ts
"use server";
// each: auth → validate(zod) → service → revalidatePath/Tag → return typed result
export async function searchTrips(input: SearchTripsInput): Promise<TripResult[]>
export async function holdSeats(input: { instanceId: string; seats: string[] }): Promise<Hold[]>
export async function createBooking(input: CreateBookingInput): Promise<Booking>
export async function cancelBooking(input: { id: string; reason: string }): Promise<Booking>
export async function checkinPassengers(input: { bookingId: string; seats: string[] }): Promise<void>
export async function upsertVehicle(input: VehicleInput): Promise<Vehicle>
export async function saveSeatMap(input: SeatMapInput): Promise<SeatMap>
export async function upsertTripTemplate(input: TripTemplateInput): Promise<TripTemplate>
export async function createCooperative(input: CreateCoopInput): Promise<Cooperative> // platform admin
```

## Conventions
- **Pagination:** cursor-based `?cursor=&limit=` → `{ data, nextCursor }`.
- **Idempotency:** `Idempotency-Key` header on POST bookings/payments.
- **Rate limits:** auth 10/min/IP, holds 30/min/session, search 60/min/IP (BotID gated).
- **Caching:** public search uses Next.js Cache Components (`use cache` + `cacheTag('trips:'+routeId)`), invalidated on instance/booking change via `updateTag`.
- **Versioning:** path `/api/v1`. Breaking changes → `/api/v2`.
