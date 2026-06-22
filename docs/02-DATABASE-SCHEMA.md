# Cooperative Plus — Database Schema (logical)

PostgreSQL (Neon). All money stored as **integer minor units** (e.g. centimes) with a `currency` column. All timestamps `timestamptz`. UUID v7 PKs (time-sortable). Every business table has `created_at`, `updated_at`, `deleted_at` (soft delete) and — where tenant-scoped — `cooperative_id`.

## Conventions
- **Tenant scope:** any table with `cooperative_id` is row-isolated. Composite indexes lead with `cooperative_id`.
- **Soft delete:** `deleted_at IS NULL` filter in all reads (enforced by repository layer).
- **Audit:** mutations append to `audit_log`.
- **Enums:** Postgres native enums.

---

## Entity-relationship overview

```
platform_user (admin)        subscription_plan
        │                            │
cooperative ──< cooperative_user >── user (better-auth)
   │  │  │                              │
   │  │  └──< subscription >── invoice  │
   │  │                                 │
   │  └──< vehicle ──< seat_map         │
   │                                    │
   ├──< destination (or global)         │
   ├──< route ──< route_stop            │
   ├──< trip_template ──< trip_exclusion│
   │        │                           │
   │        └──< trip_instance ──< seat_hold
   │                  │                 │
   │                  └──< booking >────┘ (customer)
   │                         ├──< ticket (per seat)
   │                         └──< payment ──< payment_refund
   │
   ├──< notification (outbox)
   └──< audit_log
```

---

## Tables

### Auth & identity (Better Auth managed + extensions)
- **user** — `id`, `name`, `email` (unique), `email_verified`, `image`, `phone`, `phone_verified`, `locale`, `is_platform_admin` (bool), `created_at`, `updated_at`. *(Better Auth core table; `phone`/`locale`/`is_platform_admin` are custom columns.)*
- **session** — Better Auth: `id`, `user_id`, `token`, `expires_at`, `ip`, `user_agent`, `active_cooperative_id` (custom: currently-acting tenant).
- **account** — Better Auth OAuth/credential links.
- **verification** — Better Auth email/phone OTP.

### Tenancy
- **cooperative** — `id`, `slug` (unique), `legal_name`, `display_name`, `logo_url`, `email`, `phone`, `address`, `region`, `working_hours` (jsonb), `social` (jsonb), `currency` (default `MGA`), `timezone` (default `Indian/Antananarivo`), `subscription_status` (enum), `cancellation_policy` (jsonb: cutoff_hours, refund_pct), `created_at`, `updated_at`, `deleted_at`.
- **cooperative_user** — join: `id`, `cooperative_id`, `user_id`, `role` (enum: `owner | assistant`), `permissions` (text[] — assistant fine-grained), `status` (`active | invited | disabled`), `invited_by`, `created_at`, `deleted_at`. Unique `(cooperative_id, user_id)`.

### Billing
- **subscription_plan** — `id`, `name`, `code` (unique: `starter|growth|pro|enterprise`), `price_amount`, `currency`, `interval` (`month|year`), `limits` (jsonb: max_vehicles, max_routes, max_assistants, max_trips_month), `features` (jsonb flags), `transaction_fee_bps` (basis points), `is_active`.
- **subscription** — `id`, `cooperative_id`, `plan_id`, `status` (`trialing|active|past_due|suspended|cancelled`), `current_period_start`, `current_period_end`, `trial_ends_at`, `cancel_at_period_end`, `external_ref` (Stripe sub id), `created_at`, `updated_at`.
- **invoice** — `id`, `cooperative_id`, `subscription_id`, `amount`, `currency`, `status` (`draft|open|paid|void|uncollectible`), `period_start`, `period_end`, `external_ref`, `issued_at`, `paid_at`.

### Fleet
- **vehicle** — `id`, `cooperative_id`, `registration_no`, `name`, `type` (enum), `seat_count`, `status` (`active|maintenance|retired`), `notes`, timestamps, `deleted_at`. Unique `(cooperative_id, registration_no)` where `deleted_at IS NULL`.
- **seat_map** — `id`, `vehicle_id`, `cooperative_id`, `version`, `rows`, `cols`, `layout` (jsonb: array of cells `{row,col,type,label}`), `is_active`, `created_at`. One active version per vehicle.

### Geography & network
- **destination** — `id`, `cooperative_id` (NULL = global, owned by platform), `name`, `region`, `country` (default `MG`), `lat`, `lng`, `is_popular`, `is_global`, timestamps, `deleted_at`. Index on `(name)`, `(region)`, partial `is_global`.
- **route** — `id`, `cooperative_id`, `origin_destination_id`, `dest_destination_id`, `name` (denorm `A → B`), `base_price`, `currency`, `distance_km`, `duration_min`, `status` (`active|inactive`), timestamps, `deleted_at`.
- **route_stop** — `id`, `route_id`, `cooperative_id`, `destination_id`, `position` (int), `price_from_origin` (nullable), `eta_min_from_origin`.

### Scheduling
- **trip_template** — `id`, `cooperative_id`, `route_id`, `vehicle_id`, `recurrence_type` (enum: `one_time|daily|weekly|monthly|custom`), `rrule` (text, RFC5545 for custom/weekly), `start_date`, `end_date` (nullable=open), `departure_time` (local time), `arrival_estimate_min`, `driver_name`, `driver_phone`, `driver_license`, `price_override`, `notes`, `is_active`, timestamps, `deleted_at`.
- **trip_exclusion** — `id`, `trip_template_id`, `cooperative_id`, `excluded_date`. Unique `(trip_template_id, excluded_date)`.
- **trip_instance** — `id`, `cooperative_id`, `trip_template_id` (nullable for ad-hoc), `route_id`, `vehicle_id`, `departure_at` (timestamptz), `arrival_estimate_at`, `status` (`scheduled|boarding|departed|arrived|cancelled`), `price` (snapshot), `currency`, `seat_map_snapshot` (jsonb), `seats_total`, `seats_booked` (denorm counter), `driver_name`, `driver_phone`, `notes`, timestamps, `deleted_at`. Unique `(trip_template_id, departure_at)`. Index `(cooperative_id, departure_at)`, `(route_id, departure_at, status)`.

### Booking
- **seat_hold** — `id`, `cooperative_id`, `trip_instance_id`, `seat_label`, `session_token` (anon) / `user_id`, `expires_at`, `created_at`. **Unique partial index** `(trip_instance_id, seat_label)` — combined with bookings via exclusion, this is the race-safety anchor.
- **booking** — `id`, `reference` (unique, e.g. `CP-7F3K9Q`), `cooperative_id`, `trip_instance_id`, `source` (`anonymous|customer|cooperative`), `customer_user_id` (nullable), `contact_name`, `contact_phone`, `contact_email`, `seat_count`, `total_amount`, `currency`, `status` (`pending|confirmed|cancelled|expired|completed|no_show`), `hold_expires_at`, `created_by_user_id` (staff), `cancelled_at`, `cancel_reason`, timestamps, `deleted_at`. Index `(cooperative_id, status, created_at)`, `(trip_instance_id)`.
- **ticket** — `id`, `booking_id`, `cooperative_id`, `trip_instance_id`, `seat_label`, `passenger_name`, `passenger_phone`, `price`, `checked_in_at`, `checked_in_by`, `qr_token` (unique). **Unique `(trip_instance_id, seat_label)` where booking active** — hard overbooking guard.

### Payments
- **payment** — `id`, `cooperative_id`, `booking_id`, `subscription_id` (nullable — payments serve both), `method` (`cash|mobile_money|card`), `provider` (`mvola|orange|airtel|stripe|manual`), `amount`, `currency`, `status` (`pending|paid|failed|refunded|partially_refunded`), `provider_ref` (unique per provider, idempotency), `proof_url` (Blob), `paid_at`, `received_by_user_id` (cash), `meta` (jsonb), timestamps.
- **payment_refund** — `id`, `payment_id`, `cooperative_id`, `amount`, `reason`, `status` (`pending|done|failed`), `refunded_by`, `provider_ref`, `created_at`.

### Platform services
- **notification** — `id`, `cooperative_id` (nullable for platform notices), `user_id` (recipient, nullable), `to_address` (denorm), `channel` (`email|sms|push`), `event` (enum), `template`, `payload` (jsonb), `status` (`queued|sent|failed|cancelled`), `attempts`, `next_attempt_at`, `sent_at`, `error`, `created_at`. (Outbox.)
- **notification_preference** — `id`, `user_id`, `cooperative_id` (nullable), `event`, `email`, `sms`, `push` (bools).
- **audit_log** — `id`, `cooperative_id` (nullable), `actor_user_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `before` (jsonb), `after` (jsonb), `ip`, `created_at`. Append-only, no soft delete.
- **file_asset** — `id`, `cooperative_id`, `owner_user_id`, `kind` (`logo|payment_proof|ticket`), `url`, `mime`, `size`, `created_at`.

---

## Key constraints & indexes (summary)

| Concern | Mechanism |
|---|---|
| No double-booking | Unique `(trip_instance_id, seat_label)` across active `ticket` rows; active `seat_hold` unique too; reconciled in one transaction |
| Tenant isolation | Composite indexes leading `cooperative_id`; optional RLS `USING (cooperative_id = current_setting('app.cooperative_id')::uuid)` |
| Idempotent payments | Unique `provider_ref` per provider |
| Fast search | Index `trip_instance(route_id, departure_at, status)`, `destination(name)` trigram |
| Soft-delete reads | Partial indexes `WHERE deleted_at IS NULL` |
| Hold expiry sweep | Index `seat_hold(expires_at)`, `booking(status, hold_expires_at)` |

See `src/db/schema.ts` for the executable Drizzle definition.
