# Kya Pehnu — Customer Web E2E

Playwright end-to-end tests for the customer web storefront, driving the real
Express backend.

## What is covered

- `tests/storefront-guest.spec.ts` — UI critical path: a guest explores the
  storefront, opens a product, adds it to the bag, and reaches the express
  checkout / address screen. (Final order placement needs a map-pinned
  coordinate, so the UI path stops at the address screen.)
- `tests/guest-order-api.spec.ts` — the guest COD order flow at the API boundary
  (the exact endpoints the app calls): place order, track by phone, reject a
  wrong phone, reject non-COD, and confirm `GET /api/orders/:id` refuses
  unauthenticated access (object-level authorization).

## Prerequisites

- A local MongoDB running on `127.0.0.1:27017`.
- Node + Python 3 on PATH.
- The customer web bundle exported to `../customer-app/dist-web` (the exported
  `baseUrl` is `/app`, so it is served through `webroot/app`, a symlink to it).

## Setup

```bash
cd e2e
npm install
npx playwright install chromium
# webroot/app must symlink the exported web bundle:
ln -sfn ../../customer-app/dist-web webroot/app
```

## Run

```bash
npm test            # or: npx playwright test
npx playwright show-report
```

Playwright starts both servers itself (see `playwright.config.ts` `webServer`)
and reuses them if already running:

- **backend** on `:5001`, pointed at a THROWAWAY database
  `mongodb://127.0.0.1:27017/kyapehnu_e2e` — never the `.env` `MONGO_URI`, so
  tests never touch real or production data.
- **static web** on `:8090`, serving `webroot/` so the app loads at
  `http://localhost:8090/app/`. Served over http on localhost, the bundle points
  itself at the local API on `:5001` (see `customer-app/src/api/vendorApi.js`).

The `kyapehnu_e2e` database is seeded automatically on backend boot
(`ensureBootstrapData`), so the storefront always has approved products to order.
