# Cooperative Plus — Roadmap, Subscription & Monetization

## 10. MVP Roadmap (≈12 weeks)

Goal: one cooperative can sell seats online end-to-end, staff can sell at the counter, money is collected and reconciled.

| Phase | Weeks | Scope | Exit criteria |
|---|---|---|---|
| **0 · Foundation** | 1–2 | Next.js App Router, Drizzle+Neon, Better Auth (email+OTP), tenant middleware, RBAC scaffolding, CI + preview DB branches | Auth works; tenant context enforced; migrations in CI |
| **1 · Tenancy & fleet** | 3–4 | Cooperative profile, team/assistants, vehicles, **visual seat-map editor**, destinations, routes | Owner builds fleet + network |
| **2 · Scheduling** | 5–6 | Trip templates (one-time/daily/weekly/RRULE), exclusions, **instance materialization cron** | Recurring trips generate instances |
| **3 · Booking core** | 7–8 | Public search, seat selector, **5-min holds w/ DB race-safety**, booking confirm, tickets+QR, expiry sweep | No double-booking under concurrent load test |
| **4 · Payments** | 9–10 | Cash (staff), one Mobile Money provider, Stripe card, webhooks + idempotency, proof upload, refunds | Online booking pays & confirms; reconciliation passes |
| **5 · Notifications + dashboards** | 11 | Outbox worker, email+SMS, booking/payment/reminder events, owner + admin dashboards, basic reports | Confirmations sent; dashboards live |
| **6 · Hardening + launch** | 12 | Soft deletes, audit log, rate limits, BotID, a11y pass, seed/admin tooling, load test | First paying cooperative live |

**MVP definition of done:** customer searches book pays gets ticket; assistant sells cash + checks in; owner sees dashboard + revenue; admin onboards/suspends cooperatives; seat conflicts impossible.

## 11. Future Roadmap (post-MVP)

| Quarter | Theme | Items |
|---|---|---|
| Q2 | **Mobile + reach** | Flutter app (search/book/pay/notifications/history), push (FCM), guest→account claim |
| Q2 | **Payments breadth** | All 3 MoMo operators, saved payment methods, partial payments/deposits, automated refunds |
| Q3 | **Operations** | Driver app/PWA, manifest printing, multi-stop segment pricing, waitlists, overbooking buffer config |
| Q3 | **Intelligence** | Occupancy analytics, demand forecasting, suggested schedules, dynamic pricing (opt-in) |
| Q4 | **Growth & retention** | Loyalty/points, promo codes, referrals, customer reviews/ratings of cooperatives |
| Q4 | **Platform** | Public API + partner integrations, white-label domains per cooperative, marketplace cross-coop trip stitching |
| Later | **Expansion** | Live GPS tracking, parcel/freight module, multi-currency + new countries, accounting export, USSD/feature-phone booking |

## 12. Subscription Model

Per-cooperative SaaS subscription. Money = integer minor units; example amounts in MGA (₳), monthly.

| Plan | Price/mo | Vehicles | Routes | Assistants | Trips/mo | Online tx fee | Key features |
|---|---|---|---|---|---|---|---|
| **Starter** | Free / 0 | 2 | 3 | 1 | 100 | 3.0% | Counter sales, cash, basic dashboard, email notif |
| **Growth** | 120k ₳ | 8 | 15 | 5 | 1,500 | 2.0% | + Online booking, Mobile Money + card, SMS, reports |
| **Pro** | 280k ₳ | 25 | unlimited | 15 | 10,000 | 1.0% | + Multi-stop pricing, analytics, priority support, API |
| **Enterprise** | custom | unlimited | unlimited | unlimited | unlimited | 0.5% + neg. | + White-label domain, SLA, dedicated onboarding, SSO |

- **14-day trial** on Growth for every new cooperative (`subscription.status=trialing`).
- Annual billing = 2 months free (`interval=year`).
- Limits enforced from `subscription_plan.limits`; over-limit → upsell prompt, soft-block creation.
- Status drives access: `past_due` → 7-day grace banner; `suspended` → writes blocked, trips hidden.
- Billing via Stripe Billing; invoices stored in `invoice`.

## 13. Monetization Strategy

Three revenue streams:

1. **Subscriptions (primary, predictable MRR)** — tiered above. Targets recurring base; Starter is the free funnel.
2. **Transaction fees (scales with GMV)** — basis-point fee on **online** payments only (`transactionFeeBps` per plan). Cash sales are free → encourages adoption without taxing existing offline revenue. Higher tiers pay lower bps (incentive to upgrade). Fee deducted at settlement; surfaced transparently in payment records.
3. **Value-added (expansion revenue)** —
   - SMS bundles beyond plan quota (pass-through + margin).
   - White-label custom domain (Enterprise add-on).
   - Featured placement in cross-coop search marketplace (future).
   - Premium analytics / demand forecasting add-on.
   - Payment float / settlement timing options.

**Unit economics levers:** ARPU via tier mix + tx-fee GMV; CAC via self-serve onboarding (admin creates coop in minutes); retention via the operational lock-in of schedules+bookings living in the platform.

**Pricing principles:**
- Never tax cash (their existing business) — only monetize the new online channel + the tooling.
- Free Starter removes adoption friction; conversion happens when online bookings grow.
- Transaction fee aligns platform success with cooperative success.

**North-star:** online-booking GMV per active cooperative — grows both tx-fee revenue and the case for upgrading tiers.
