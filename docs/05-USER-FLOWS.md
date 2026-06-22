# Cooperative Plus — User Flows

## 1. Customer: search → book → pay (happy path)
```
Search (origin, dest, date, pax)
   └─> Results list (price, time, seats left, coop)
        └─> Select trip → Seat map
             └─> Pick seats → POST holds (5-min timer starts)
                  ├─ seat taken → 409 → re-render map, ask re-pick
                  └─ ok → Passenger info form (name/phone/email per seat)
                       └─> Choose payment: Mobile Money | Card | (Cash at station)
                            ├─ online → gateway → webhook → status=paid
                            │     └─> Booking confirmed → ticket + QR + notifications
                            ├─ cash → booking pending, pay at station before cutoff
                            └─ hold expires before pay → booking expired, seats released
```
Edge cases: hold expiry mid-checkout (banner + restart), partial payment failure (retry), anonymous user prompted to optionally create account post-booking (link by phone).

## 2. Anonymous quick booking
Same as (1) but identity = `(contactPhone, contactEmail)`; `source=anonymous`; reference + QR sent by SMS/email; "claim this booking" link merges into an account if they sign up with the same phone.

## 3. Assistant: counter sale (station, offline-tolerant)
```
Dashboard → Today's departures → pick trip
   └─> Seat map (fast keyboard/tap) → select seats
        └─> Enter passenger names/phones
             └─> Collect cash → payment.cash.collect → paid
                  └─> Print/SMS ticket → seatsBooked++
```
Optimized for speed: single screen, no payment redirect, keyboard seat entry, recent-customers autocomplete.

## 4. Assistant: check-in / boarding
```
Trip → status=boarding → scan QR or search reference
   └─> ticket.checkedInAt set → seat turns green
        └─> all checked → mark departed
```

## 5. Owner: create recurring trip
```
Routes (ensure route exists) → New trip template
   └─> Pick route + vehicle → recurrence (daily/weekly/custom RRULE)
        └─> departure time, driver, price override, excluded dates
             └─> Save → scheduler materializes instances for 60-day horizon
                  └─> Instances appear in calendar; editable per scope
```

## 6. Owner: cancel a trip instance
```
Instance → Cancel (reason)
   └─> all active bookings → cancelled, refunds computed per policy
        └─> notifications: trip_cancelled_by_coop to all passengers
             └─> seats released, instance status=cancelled
```

## 7. Platform admin: onboard cooperative
```
Admin → New cooperative (name, slug, owner email, plan)
   └─> provision Owner user + invite email (set-password link)
        └─> subscription=trialing (14d) → owner completes profile
             └─> owner adds vehicles/routes/trips → goes live
```

## 8. Platform admin: suspend cooperative
```
Admin → cooperative → Suspend (reason)
   └─> subscriptionStatus=suspended → all tenant writes blocked (reads allowed for support)
        └─> public trips hidden from search → reactivate restores
```

## 9. Payment reconciliation (system)
```
Gateway webhook → verify signature → find payment by provider_ref (idempotent)
   ├─ paid → booking.confirmed, tickets issued, notify payment_received
   ├─ failed → notify payment_failed, hold may expire
   └─ unmatched → queue for manual review (alert)
Nightly job: reconcile pending>cutoff, expire stale holds, mark no-shows post-departure.
```

## 10. Notification lifecycle (outbox)
```
Event fires (booking_confirmed) → enqueue notification rows per channel/pref
   └─> worker (cron, ~1 min) picks queued, sends via provider
        ├─ ok → sent_at
        └─ fail → attempts++, exponential backoff, cap at N → status=failed + alert
```

## State machines

**Booking:** `pending → confirmed → completed` ; `pending → expired` ; `pending|confirmed → cancelled` ; `confirmed → no_show`.

**Payment:** `pending → paid → (refunded | partially_refunded)` ; `pending → failed`.

**Trip instance:** `scheduled → boarding → departed → arrived` ; `scheduled|boarding → cancelled`.

**Seat:** `available → held(5min) → booked` ; `held → available(expiry)`.
