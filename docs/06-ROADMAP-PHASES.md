# 06 — The Roadmap: Nine Phases from Prototype to Store

Durations assume **one to two full-time engineers**. Halve them with four.
Phases 4 and 5 run in parallel with the phases beside them; everything else is
sequential because it is load-bearing.

**Total: ~22 weeks to public launch**, of which ~4 weeks are external waiting
time that must be started on day one.

---

## Phase 0 — Unblock the clock, then stop the bleeding
**Week 1–2. Nothing here is optional and most of it is not code.**

### 0a. Start every long-lead item on day one, in this order

| Item | Lead time | Owner |
| --- | --- | --- |
| Meta Business verification → WhatsApp Business Account → number → templates | **3–10 days + 48 h per template** | Founder |
| Porter commercial account + production API access | **2–4 weeks** | Founder |
| DLT registration (entity, sender id, SMS templates) | **1–2 weeks** | Founder |
| Razorpay onboarding (needs GST, PAN, bank, public policy pages) | 3–7 days | Founder |
| Apple Developer (org needs a D-U-N-S number) + Google Play | 1–2 weeks | Founder |
| Entity + GST registration if not already done | 2–3 weeks | CA |
| Legal pages drafted (T&C, privacy, refunds, shipping, grievance officer) | 1 week | Lawyer |

Every one of these blocks a later phase. None of them requires the code to
work. **If only one thing happens in week 1, it is this table.**

### 0b. Engineering hygiene

- Fix the **`getOrderById` authorisation hole** — any authenticated user can
  currently read any order, with the customer's address and phone.
- zod validation on every route; delete `{ ...req.body }` spreads.
- helmet, CORS allowlist, per-route rate limits, body size cap.
- Boot-time env schema validation.
- pino structured logging + request ids; Sentry on backend and app.
- Jest + supertest + `mongodb-memory-server` harness with the first ten tests.
- GitHub Actions: lint, typecheck, test, `gitleaks` on every PR.
- Rename the app identifiers (`in.kyapehnu.app`, slug `kyapehnu`) **before any
  build is published anywhere**.
- Commit the `vendor-app/` deletion and the unified-binary decision.

**Exit criteria:** CI green on every PR; no route accepts unvalidated input; no
cross-tenant data leak; every external onboarding submitted and tracked.

---

## Phase 1 — Make the app real
**Week 3–5. The single largest phase. The customer app has never spoken to the
backend.**

- **Firebase Auth, properly.** Phone/OTP as primary (India), Google as
  secondary. Login, OTP, profile completion screens. Token persistence and
  refresh in `useAuthStore`, session restore on cold start, sign-out. Delete
  `extra.devAuthToken`.
- **Role from the backend**, not a toggle. `POST /api/auth/session` returns
  `{ role, profile }` based on whether the uid resolves to a Vendor. Gate the
  Profile toggle behind a dev flag.
- **Customer API surface** — extend `vendorApi.js` (and rename it `api/`):
  nearby vendors, product list with filters and pagination, product detail,
  cart validation, order create, order history, order detail, addresses.
- **Kill the mocks.** `mockStores.js` becomes seed data for staging, imported
  by a script, not by a screen.
- **Server-computed pricing.** The `pricing` object from
  [03](03-ADMIN-AND-ECONOMICS.md) §B0. Client sends ids and quantities only.
- **Stock, transactionally.** Conditional decrement, 10-minute reservation at
  checkout, release-on-timeout sweep.
- **Cart policy decision implemented** — one cart, per-vendor sub-orders.
- **Payments.** Razorpay order create → checkout → server-side signature
  verification → webhooks. COD as a second path with caps.
- **Address flow.** Map pin, house/landmark, receiver phone, serviceability
  check *before* payment, save to address book.
- **Order history + order detail** for the customer.
- **Push notifications.** Device token registration, FCM send path, deep links
  into the order.
- **Idempotency keys** on checkout.
- **Analytics instrumented** ([03](03-ADMIN-AND-ECONOMICS.md) Part C) — PostHog
  events defined now, not later.

**Exit criteria:** a real person, on a real phone, signs in, browses live
catalogue data, pays, and an order exists in the database with a correct,
server-computed price and a decremented stock count.

---

## Phase 2 — Logistics and alerting that actually work
**Week 6–8.**

- **Porter production integration**: quote at checkout (fee and ETA shown
  before payment), create, track, cancel, and **webhooks** mapped to order
  status. Behind a `LogisticsProvider` interface.
- **Live tracking, for real.** Backend polls Porter and mirrors
  `{lat,lng,at}` into Firebase Realtime DB at `/trips/{orderId}`; customer and
  vendor both subscribe. Delete the simulated route.
- **Map migration to MapLibre** with a bespoke obsidian style
  ([04](04-INFRASTRUCTURE.md) §2). Do this before map code spreads.
- **The escalation ladder** ([02](02-INTEGRATIONS.md) §A2): push → WhatsApp →
  SMS → IVR → reassign/cancel, driven by a durable due-at sweep, each rung
  cancelled on acceptance.
- **Notification outbox** with retry, backoff, and a dead-letter view.
- **Vendor alarm UX**: high-importance channel, looping sound, full-screen
  takeover, swipe-to-accept.
- **Failure paths built, not discovered** — the whole table in
  [02](02-INTEGRATIONS.md) §B3.
- **Cancellation and refund** for customer and ops.

**Exit criteria:** an order placed in the app dispatches a real Porter rider,
both parties watch the same live position, and a vendor who ignores their phone
gets called by a robot within 90 seconds.

---

## Phase 3 — WhatsApp vendor operations
**Week 9–11.**

- Signature verification, raw-body handling, async processing, dedupe on
  `messages[].id`, per-`waId` serialisation.
- `WhatsappSession` state machine with interactive list/button messages.
- Media pipeline: two-step download with the bearer token → validate → strip
  EXIF → three WebP derivatives via sharp → CDN → draft product.
- Multi-photo grouping (90-second window + explicit done).
- `Product.status` lifecycle (`DRAFT → PENDING_QC → APPROVED | REJECTED`),
  `source`, `sku`, `measurements`, `occasionTags`.
- Quick commands (`STOCK`, `OFF`, `ON`, `PRICE`, `ORDERS`, `TODAY`, `CLOSE`,
  `HELP`) with **Hindi and Marathi** keywords and replies.
- Approval and rejection notifications back to the vendor, templated and
  translated, with actionable rejection reasons.
- The same catalogue flow in-app (`CatalogManagerScreen` gets real image
  upload) so a vendor can use either surface.

**Exit criteria:** a shopkeeper who has never opened the app photographs a
shirt, answers five questions on WhatsApp, and the shirt is buyable by a
customer 400 metres away within ten minutes of QC approval.

---

## Phase 4 — Admin panel and the money model
**Week 9–12 — runs in parallel with Phase 3.**

- Next.js admin on Cloudflare Pages, Firebase custom-claim roles, `AuditLog`
  on every mutation.
- **QC queue first** (Phase 3 is useless without it), then the **live order
  board** (Phase 2 is unoperable without it).
- Vendors + KYC pipeline, reliability scorecards.
- Pricing engine UI: commission rules, delivery fee rules, surge, caps, taxes.
- Promotions: coupon builder with budget caps; referrals.
- Finance: vendor ledgers, settlement runs, netting, GST reports.
- Merchandising: home rails, Chapters content, answer-engine look bundles.
- Support queue + grievance inbox.
- Platform controls: feature flags, serviceability polygons, kill switches,
  minimum app version.
- Analytics dashboard, with **delivery cost vs delivery fee on the front page**.

**Exit criteria:** the business can be operated for a day without an engineer.

---

## Phase 5 — Identity: design system, motion, polish
**Week 9–13 — runs in parallel with Phases 3 and 4, by a designer + one
engineer.**

- Typography system shipped ([01](01-PRODUCT-IDENTITY.md) §2.2) — the highest
  identity leverage available.
- `motion.js`, `haptics.js`, `typography.js`, `elevation.js` token files, with
  the same "no value outside this file" discipline as `colors.js`.
- The five signature moments: **the Unfurl, the Rail, the Thread, the Fold, the
  Window Light.**
- Component library + a dev-flag gallery screen showing every state.
- Every empty, loading, error, and offline state designed — currently none
  exist.
- 3D scene repositioned: first-run cinematic, static hero for returning users,
  full scene in Chapters, device-tier and reduce-motion gating.
- Cold-start budget enforced in CI (≤ 2.5 s on a 4 GB Android device).
- Accessibility pass: contrast audit, dynamic type, labels, hit targets,
  reduce-motion, map text equivalent.
- Copy pass across the whole app in the defined voice.

**Exit criteria:** a stranger shown two screenshots for three seconds can
describe the app to someone else.

---

## Phase 6 — The differentiators
**Week 14–17.**

- **The "Kya Pehnu?" answer engine** — occasion → budget → for-whom → 3–5
  complete looks from in-stock local inventory. Rules engine over admin-curated
  tags. This becomes the home screen's centre.
- **Fit profile + size guidance** — measurements from the vendor at listing
  time (already captured in Phase 3), a 60-second customer profile, and a
  fit badge on every size chip.
- **Try Rack** — up to 3 sizes brought, 10-minute wait, keep what fits, partial
  capture via Razorpay pre-auth. Limited catalogue, ₹49 fee waived on any keep,
  abuse guard on keep-rate. **The category-defining feature.**
- **Returns and exchanges** — "wrong size, new size in 45 minutes", with the
  reverse leg and the ledger entries.
- **Wardrobe** — purchased items as a visual closet, reorder, "wear it with".
- **Shop pages** — owner, shutter photo, hours, distance, rating, full rail.
- **Search + filters + sort**, with the text index and colour/occasion facets.
- **Ratings and reviews** for product and shop; `Vendor.rating` finally means
  something.
- Wishlist, follow-a-shop with drop alerts, referral program, first-order
  offer, **Nagpur Now** ticker, occasion/shared carts.

**Start the Play closed test (12 testers, 14 continuous days) at the beginning
of this phase**, not at the end of Phase 8.

**Exit criteria:** the app does something no national player can copy without
local inventory.

---

## Phase 7 — Hardening, testing, compliance
**Week 18–20.**

- Test suite to target ([05](05-COMPLIANCE-AND-STORE-LAUNCH.md) §3): 80% on
  controllers and services, contract fixtures for all three external providers,
  Maestro E2E on both flows, k6 load test on the checkout race.
- Circuit breakers, degraded modes, `/ready`, graceful shutdown, synthetic
  order probe.
- Nightly encrypted backups to R2 **with a tested restore**.
- Security review pass: authz matrix per route, App Check, number masking,
  PII-free logs, secret rotation.
- Legal pages live and linked; account deletion in-app and on the web.
- Store assets: screenshots, preview video, descriptions, data safety form,
  privacy labels, content ratings, demo accounts, review notes.
- Remove or gate every debug affordance, including the Vendor Mode toggle.
- Performance: bundle size, image sizes, list virtualisation, cold start,
  crash-free session baseline.

**Exit criteria:** the pre-submission checklist in
[05](05-COMPLIANCE-AND-STORE-LAUNCH.md) §5.3 is fully ticked.

---

## Phase 8 — Pilot launch
**Week 21–22, then ongoing.**

- **Supply first:** 30–50 shops across Dharampeth, Sitabuldi, Ramdaspeth, and
  Civil Lines, onboarded, with their first 20 listings created *for* them by a
  person with a phone.
- Four neighbourhoods only. 45 minutes is a density problem before it is a
  logistics problem.
- Internal testing → Play closed test (already running) → staged rollout
  10% → 50% → 100%, gated on crash-free sessions and order-success rate.
- Manual ops on the order board for the first 500 orders. Log every failure;
  that log is the Phase 9 backlog.
- Launch during wedding or festival season, when apparel intent is highest and
  occasion carts have a reason to exist.

**Exit criteria:** 100 orders delivered, p90 under 60 minutes, and a written
list of everything that broke.

---

## Phase 9 — Scale (post-launch, continuous)

- Widen the delivery radius neighbourhood by neighbourhood as supply thickens.
- Second logistics provider behind the existing interface; consider in-house
  riders for peak hours and for Try Rack's paid wait.
- Vendor self-serve onboarding once the manual funnel is understood.
- Collaborative-filter re-rank on the answer engine at ~5k orders.
- Video: vendor stories, shop windows, short-form drops.
- Second city — but only after the delivery-cost-vs-fee line is positive in
  Nagpur.
- Atlas M10, paid tiers on the services whose free limits are binding
  ([04](04-INFRASTRUCTURE.md) §1).

---

## Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Porter production access delayed | Blocks Phase 2 | Started week 1; build the provider interface with a mock adapter so Phase 2 is testable without it. |
| Meta template rejections | Blocks Phase 3 | Submit early, keep templates strictly utility-toned, prepare SMS-only fallback copy. |
| Play 14-day closed test | Blocks launch by 2 weeks | Start it in Phase 6, or register an organisation account (exempt). |
| Vendors will not adopt WhatsApp listing | Kills the supply moat | Do the first 20 listings manually; the bot is for listing #21. Measure adoption per vendor weekly. |
| 45-minute promise missed | Kills the brand | Launch four neighbourhoods, not a city. Publish an honest ETA, not an aspirational one. Compensate misses automatically. |
| Return rate destroys margin | Kills the company quietly | Fit profile in Phase 6, Try Rack keep-rate monitored per user, vendor measurement quality in the QC score. |
| 3D scene tanks low-end Android | Kills activation | Device-tier gating and the CI cold-start budget in Phase 5. |
| Free tiers cold-start the order path | Missed alerts | The one paid line item: an always-on API instance. Non-negotiable. |
| Single engineer, 22 weeks | Schedule risk | Phases 3/4/5 are explicitly parallelisable — that is where a second and third person go. |

---

## The compressed answer

If everything else is stripped away, the plan is:

1. **Week 1:** start Meta, Porter, DLT, Razorpay, Apple, Google, GST. Fix the
   order-authorisation hole.
2. **Weeks 3–8:** make the app real — auth, live data, server-side pricing,
   payments, stock, Porter, live tracking, and an alert ladder that ends in a
   robot phoning the shopkeeper.
3. **Weeks 9–13:** in parallel — WhatsApp listing, the admin panel and money
   model, and the design identity.
4. **Weeks 14–17:** the things nobody else can copy — the answer engine, fit
   certainty, and Try Rack.
5. **Weeks 18–22:** harden, comply, and launch four neighbourhoods with fifty
   shops during wedding season.

The moat is not the app. It is **fifty shopkeepers in Nagpur who list their
stock by sending a photo to a WhatsApp number**, and a rider who will wait ten
minutes while you try the shirt on.
