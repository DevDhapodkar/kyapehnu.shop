# 05 — Hardening, Compliance, and Getting Through Store Review

The technical work is the easy half. The rejections that cost weeks come from
policy, not code.

---

## 1. Security hardening (backend)

Current state: no validation, no rate limiting, no helmet, wildcard CORS, no
webhook signature checks. All of it is one focused week.

**Request layer**
- `helmet()`, `express.json({ limit: '1mb' })`, compression.
- CORS allowlist (admin origin + nothing else; the mobile app is not a browser
  origin and needs no CORS at all).
- Rate limits, per-route not global: OTP 5/hour/number, order create
  10/hour/user, webhooks 100/min/IP, everything else 100/min/token.
- Request id on every request, propagated into logs and error reports.

**Validation** — zod schemas at every boundary, with the parsed result (never
`req.body`) passed onward. Specifically kill `{ ...req.body }` spreads in
`createProduct` and `updateProduct`; today a vendor can set any field on a
product document, including ones added later.

**AuthZ** — currently a vendor can `PATCH` an order only if it is theirs
(good), but `getOrderById` checks nothing: **any authenticated user can read
any order**, including another customer's address and phone. Fix in Phase 0.

**Webhooks** — verify signatures for Meta (`X-Hub-Signature-256`), Razorpay,
and Porter. Store raw bodies for signature computation. Dedupe by provider
event id. Respond 200 fast, process async.

**Data** — encrypt nothing that does not need it, but: no PII in logs, phone
numbers masked in the admin UI below `SUPPORT` role, Firebase App Check on the
mobile app to stop scripted API abuse, and rider↔customer calls through
Exotel number masking rather than raw numbers.

**Money** — server-computed prices, idempotency keys, signature-verified
payment confirmation, and refunds behind a role + audit log.

**Secrets** — rotate anything that has been in a commit or a chat. Add
`gitleaks` to CI.

---

## 2. Reliability

- **Stock decrement inside a transaction** at order confirmation, with a
  conditional update (`sizes.$.stock >= qty`) so two concurrent buyers cannot
  both win. Mongo transactions need a replica set — Atlas M0 provides one.
- **Reservation window**: hold stock for 10 minutes at checkout, release on
  timeout via the same sweep job that drives escalations.
- **Outbox** for every outbound side effect (WhatsApp, SMS, IVR, push, Porter)
  with retry, backoff, and a dead-letter view in admin.
- **Circuit breakers** on Porter and Meta, with degraded-mode behaviour defined
  per dependency (documented in [02](02-INTEGRATIONS.md) §B3).
- **Health endpoints**: `/health` (liveness) and `/ready` (Mongo + Redis
  reachable), plus a synthetic order probe from the uptime monitor.
- **Graceful shutdown** so in-flight requests finish on deploy.

---

## 3. Testing

Zero tests today. Target, in priority order:

| Layer | Tool | Scope |
| --- | --- | --- |
| Backend unit | Jest / Vitest | Pricing engine (**highest value — it is money**), status transitions, escalation ladder logic, WhatsApp parser. |
| Backend integration | supertest + `mongodb-memory-server` | Every route: auth, authz, validation, idempotency. |
| External contracts | nock fixtures | Porter, Meta, Razorpay — recorded responses including their error shapes. |
| App unit | React Native Testing Library | Stores (cart maths, fit mapping), hooks, formatters. |
| App E2E | Maestro | Sign in → browse → add to bag → address → pay (test mode) → track. Vendor: receive → accept → ready. |
| Load | k6 | 100 concurrent checkouts against staging; the stock-decrement race is the thing being tested. |

Coverage target 80% on `backend/controllers` and `backend/services`; do not
chase coverage on screens. CI gate: lint + typecheck + unit + integration on
every PR.

---

## 4. Legal and regulatory (India)

Non-optional for a marketplace taking payments. Get a CA and a lawyer for the
first three; the rest is process.

- **Entity + GST registration.** Required by Razorpay and by the marketplace
  TCS rules.
- **Consumer Protection (E-Commerce) Rules 2020** — the app must display, per
  listing: seller name and address, country of origin, total price with an
  itemised breakdown, return/refund/exchange policy, delivery timelines, and
  **a named grievance officer with contact details and a 48-hour
  acknowledgement / 1-month resolution commitment.** Most of this is missing
  and several items are also App Store review checks.
- **Legal Metrology (Packaged Commodities) Rules** — MRP, net quantity,
  importer/manufacturer details on listings for packaged goods.
- **Terms of Service, Privacy Policy, Refund & Cancellation Policy, Shipping
  Policy** — published at public URLs, linked in-app and in both store
  listings. Razorpay checks for these during onboarding too.
- **DPDP Act 2023** — consent for data collection, purpose limitation, a
  data-deletion mechanism, breach notification readiness. The account-deletion
  requirement below satisfies part of this.
- **Vendor agreement** — commission, settlement terms, quality obligations,
  liability for the goods (the platform is an intermediary, not the seller),
  indemnity.
- **Rider/logistics** — Porter carries its own compliance; keep the contract.

---

## 5. Store submission

### 5.1 Accounts and lead times

| Item | Cost | Lead time |
| --- | --- | --- |
| Apple Developer Program | $99/yr | 1–2 days, longer for an organisation (needs a D-U-N-S number — **start early**) |
| Google Play Developer | $25 once | 1–2 days, plus identity verification |
| **Play closed testing requirement** | — | **Personal/individual accounts must run a closed test with 12+ testers opted in for 14 continuous days before applying for production access.** This is a hard 2-week gate. Organisation accounts are exempt. **Start it during Phase 6, not Phase 8.** |

### 5.2 What both stores will check

- **Account deletion** — an in-app path to delete the account *and* a public
  web URL. Mandatory on both stores. Currently absent.
- **Privacy labels / Data safety form** — declare location, contacts (none),
  identifiers, purchase history, photos (vendor uploads). Must match actual
  behaviour; mismatches are a common rejection.
- **Location permission justification** — foreground only, with the purpose
  string already written in `app.json` (good). Do not add background location
  unless a rider app needs it, and then justify it explicitly.
- **A working demo account** with seeded data, in the review notes, for both
  the customer flow and (if the vendor flow is reachable) the vendor flow.
  A reviewer who lands in an empty city sees a broken app.
- **The Vendor Mode toggle must be gated** behind a real vendor account before
  submission — a debug switch in Profile reads as unfinished software.
- **In-app purchase rules**: selling physical goods delivered in the real world
  correctly uses an external payment processor. No IAP required. Keep it
  unambiguous — no digital goods, no subscriptions in v1.
- **Payments disclosure**: Google Play requires clear pricing and refund terms;
  Apple requires the same plus accurate metadata.
- **Content rating questionnaire** (Play) and **age rating** (Apple).
- **Screenshots** for every required device size, plus an App Preview video.
  The Thread countdown and the Unfurl transition are what should be on screen.
- **App icon, splash, feature graphic (Play), promo text, description,
  keywords.**
- **Crash-free requirement** — Play penalises apps above its bad-behaviour
  thresholds. Sentry must be live before the first public build.
- **Export compliance** (Apple) — standard HTTPS only, declare it.

### 5.3 Pre-submission checklist

- [ ] Bundle id / package name finalised (`in.kyapehnu.app`), never to change
- [ ] Signing keys generated and backed up (losing the Play upload key is
      unrecoverable without Play App Signing enrolment — enrol)
- [ ] Version + build numbers automated in CI
- [ ] All debug affordances removed or flag-gated
- [ ] No console logging of PII in release builds
- [ ] ProGuard/R8 + Hermes on Android; bitcode-free iOS release build
- [ ] Cold start ≤ 2.5 s on a 4 GB Android device, measured
- [ ] App size under 60 MB download (the GLBs move to CDN)
- [ ] Reduce-motion, dynamic type, and contrast audited
- [ ] Legal pages live at public URLs and linked in-app
- [ ] Account deletion path live, app + web
- [ ] Demo accounts seeded and documented in review notes
- [ ] Support email monitored, grievance officer named
- [ ] Staged rollout configured; rollback plan written

---

## 6. Launch operations (the part that is not software)

- **Seed supply before demand.** 30–50 shops in Dharampeth, Sitabuldi,
  Ramdaspeth, and Civil Lines, onboarded and photographed, *before* a single
  marketing rupee. An empty marketplace churns users permanently.
- **Do the vendor's first 20 listings for them.** Send a person with a phone.
  The WhatsApp bot is for listing #21 onwards; a vendor's first experience must
  be effortless, not a tutorial.
- **Manual ops for the first 500 orders.** Watch the order board, call vendors,
  fix things by hand, and write down every failure. That list is the Phase 8
  backlog and it is worth more than any amount of upfront design.
- **One neighbourhood at a time.** 45 minutes is only achievable with dense
  supply. Nagpur-wide on day one guarantees a broken promise; four
  neighbourhoods guarantees a kept one.
- **Fixed launch window.** Wedding season or a festival — high apparel intent,
  and the occasion-cart feature has a reason to exist on day one.
