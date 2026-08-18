# 07 — COD Launch: What Was Built

This phase makes the app publishable **without** the company registration that
online payments and Porter still depend on. Payments run as **Cash on Delivery**,
Porter dispatch and online payments are **feature-flagged off**, and everything
else the council flagged as a launch blocker is fixed.

Registration-gated work (payment gateway, Porter live dispatch, GST) is wired
behind flags so it can be switched on later without a rewrite.

---

## Money model (all amounts stored as integer paise)

```
sellingPrice = basePrice (vendor's price)  +  margin (Kya Pehnu's cut, admin-set)

itemsSubtotal  = Σ sellingPrice · qty        (customer pays for goods)
platformFee    = ₹25 flat                     (PLATFORM_FEE_PAISE)
deliveryFee    = ₹0   (Porter deferred)
tax            = ₹0   (until GSTIN)
grandTotal     = itemsSubtotal + deliveryFee + tax + platformFee
vendorPayout   = Σ basePrice · qty            (owed to the shop)
platformEarnings = Σ margin · qty + platformFee
```

Pricing is a pure, unit-tested module (`services/pricing.js`) and is recomputed
server-side on every order — the client total is never trusted.

## Product approval + margin workflow

`DRAFT → PENDING_APPROVAL → APPROVED | REJECTED`. A vendor submits a listing with
a base price; it is invisible to customers until an admin approves it **and sets
the margin** in the admin portal. Selling price = base + margin, computed on save.

## Order lifecycle (state machine, `services/orderStateMachine.js`)

```
PENDING → ACCEPTED → READY_FOR_PICKUP → IN_TRANSIT → DELIVERED
   (cancel / reject at allowed states) → CANCELLED / REJECTED (stock restored)
```

Every transition is actor-checked (CUSTOMER / VENDOR / ADMIN / SYSTEM). A vendor
can no longer jump straight to DELIVERED. On DELIVERED, COD payment is marked
COLLECTED. While Porter is off, an order rests at READY_FOR_PICKUP and a
vendor/admin advances it manually.

## Admin portal (`/admin`, server-rendered)

Separate email + bcrypt password + JWT-cookie auth (independent of Firebase).
Seed the first admin:

```
ADMIN_EMAIL=ops@kyapehnu.shop ADMIN_PASSWORD='min-10-chars' \
ADMIN_NAME='Ops' ADMIN_ROLE=SUPER_ADMIN npm run seed:admin
```

Pages: dashboard (GMV, earnings, queues), product approval (set margin), vendor
approval (KYC), order board + detail (cancel + restock), HTML invoice (print to
PDF), and platform settings (fees, default margin, COD cap).

## Billing / invoices

Every order gets an immutable `Invoice` (`KP-INV-YYYY-NNNNNN`) with a full
breakdown, snapshotting seller/buyer at issue time. Readable by the order owner
via `GET /api/orders/:id/invoice` and rendered as a printable page in the portal.

---

## Council findings → fixes

| Council finding | Fix |
| --- | --- |
| IDOR on `GET /orders/:id` | Ownership check (customer or vendor); 404 on mismatch |
| Client-trusted `totalPrice` | Server recomputes price + fees from APPROVED products |
| Stock never decremented / oversell | Atomic `$inc` guard inside a transaction; restock on cancel |
| No transactions | `runInTransaction` (degrades on standalone Mongo) |
| Product ownership theft (`updateProduct`) | Zod whitelist; `vendor`/`status`/`margin` never settable from body |
| Order-status fraud (no state machine) | `assertTransition` actor-checked machine |
| No input validation | Zod schemas on every body/query/params |
| No helmet / rate-limit / CORS allowlist / body cap | All added in `server.js` |
| Unauthenticated WhatsApp webhook | `X-Hub-Signature-256` HMAC, timing-safe |
| No idempotency | `idempotencyKey` unique index on orders |
| No env validation at boot | `config/env.js` fails fast on missing required vars |
| Error message leakage | Central handler; generic 500 in production |
| PII in logs | Redacting structured logger |
| Static `/health` | Reports Mongo connectivity + feature flags |
| Porter hardcoded UAT URL | `PORTER_API_BASE` env, dispatch behind `PORTER_ENABLED` |
| No money model / commission / payout | Full paise breakdown + margin + platform earnings on every order |
| No admin panel / QC / onboarding | Server-rendered admin portal |
| No cancellation/refund path | CANCELLED/REJECTED states + COD refund status + restock |
| No tests / CI | `node:test` suite (money, pricing, state machine, validation, wiring) + GitHub Actions |
| Vendor Mode toggle shipped live | Gated behind `expo.extra.enableVendorModeToggle` (dev-only) |
| No customer API client | `customer-app/src/api/customerApi.js` |
| Fake checkout | COD checkout posts to `/orders` with idempotency (falls back to demo on mock data) |
| ₹25 platform fee not shown | Itemised in the cart bill + enforced server-side |
| Android package `com.anonymous.*` | Set to `com.dhapodkardev.kyapehnu` |

## Deferred until company registration completes

- **Online payments** (`PAYMENTS_ENABLED=false`) — COD only for now.
- **Porter live dispatch** (`PORTER_ENABLED=false`) — orders wait at
  READY_FOR_PICKUP for manual dispatch; live tracking stays simulated.
- **GST/tax** (`taxBps=0`) — enable once a GSTIN exists.
- **Vendor payouts** — ledger fields captured; settlement runs post-registration.

## Database connection & integration testing

- **Production connection** (`config/db.js`) is hardened: connection pool +
  timeouts, lifecycle event logging (disconnect/reconnect/error), a bounded
  retry-with-backoff on the initial connect, and `syncIndexes()` so the unique
  constraints the app relies on (idempotency key, order/invoice numbers, emails)
  are actually built. Point `MONGO_URI` at a MongoDB Atlas **replica set** so the
  transactional order path runs with full atomicity.
- **Seed a real database** so it's usable immediately:
  ```
  MONGO_URI=... ADMIN_EMAIL=ops@kyapehnu.shop ADMIN_PASSWORD='min-10-chars' npm run seed
  ```
  Creates approved Nagpur shops, approved products (with margin), a customer, an
  admin, and default platform settings.
- **Integration tests** (`test/integration/`) run the real order round-trip
  against an actual MongoDB — server-side pricing + ₹25 fee, atomic stock
  decrement, oversell rejection, idempotency, cancel/restock, the state machine,
  and invoice numbering. They resolve a database in this order:
  1. `MONGO_TEST_URI` (any real Mongo you point them at), else
  2. `mongodb-memory-server` as a single-node **replica set** (downloads a
     `mongod`; works wherever egress allows it — e.g. CI).

  If neither is reachable they **skip with a clear reason** (so `npm test` stays
  green in a sandbox with no database). CI runs them for real:
  `npm run test:integration`.

## Storefront wired to the live API

The customer storefront now reads from the backend, not just mocks:
`useCatalog(coords)` fetches nearby **approved** shops + their **approved,
in-stock** products, maps them to the UI shape (`data/catalogAdapter.js`), and
falls back to the bundled mock catalogue when there's no session token yet or the
backend is unreachable. Once real products flow through, cart lines carry real
ObjectIds and checkout posts a COD order to `/orders` (server-priced, idempotent).

## Running

```
cd backend && npm install
npm test                 # 29 unit tests (no DB needed)
npm run test:integration # real-DB round-trip (needs MONGO_TEST_URI or CI egress)
npm run seed:admin       # or: npm run seed  (full demo data)
npm start                # API + /admin portal
```

> Note: a live MongoDB cannot run inside the restricted dev sandbox — the
> `mongod` binary download host (`fastdl.mongodb.org`) is denied by the
> environment's egress policy, and there's no system Mongo or Docker daemon. The
> integration tests are real and execute against an actual MongoDB in CI; in the
> sandbox they skip cleanly with that reason.
