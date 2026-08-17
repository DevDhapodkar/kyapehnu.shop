# 00 — State of the App: What Exists, What Is Missing

Audit date: 2026-08-09. Read this before the roadmap; every phase in
[06-ROADMAP-PHASES.md](06-ROADMAP-PHASES.md) closes a gap listed here.

---

## 1. What actually exists today

### Backend (`/backend`, Express 5 + Mongoose 9, ESM)

| Area | State |
| --- | --- |
| `server.js` | 41 lines. CORS wide open, JSON body parser, `/health`, five route mounts, one error handler. |
| Models | `User`, `Vendor`, `Product`, `Order`. Geo-indexed on `location` / `currentLocation`. |
| Auth middleware | `verifyToken` (Firebase ID token) + `requireUser` / `requireVendor` profile resolution. Works. |
| Users | `POST /sync`, `GET /me`, `POST /me/addresses`, `PATCH /me/location`. |
| Vendors | `POST /sync`, `GET /me`, `GET /nearby` (`$near`, 5 km default). |
| Products | create, list-by-vendor, list-mine, get, patch. |
| Orders | create, get, list-vendor, `PATCH /:id/status`, `POST /:id/ready`. |
| `transitionToReady` | Saves `READY_FOR_PICKUP` first, then fires Porter + WhatsApp under `allSettled`, promotes to `IN_TRANSIT` only on Porter success. This is genuinely good design and should be preserved. |
| Porter | One `POST /orders/create` call against the **UAT** gateway. No quote, no tracking, no cancel, no webhook. |
| WhatsApp | Two outbound template sends. Webhook verify handshake works; `handleIncomingWebhook` logs the body and returns 200. Nothing is parsed. |

### Customer app (`/customer-app`, Expo 57 / RN 0.86 / React 19)

| Area | State |
| --- | --- |
| Shell | `App.js` → `AppNavigator`. Role switch (`CUSTOMER` \| `VENDOR`) drives two separate native stacks, keyed to force a clean remount. Sound. |
| Customer screens | Home (3D scrollytelling + product feed), ProductDetail, Cart, LiveTracking, Profile. |
| Vendor screens | OrderList, OrderDetail, CatalogManager. |
| State | Zustand: `useAuthStore`, `useCartStore`, `useVendorStore`. |
| API client | `src/api/vendorApi.js` — axios, token injected once at a single seam, errors flattened to readable `Error`s. Vendor endpoints only. |
| Theme | `src/theme/colors.js` — obsidian/charcoal/crimson/gold monochrome, glass tokens, status colours, `spacing`, `radii`. |
| 3D | `ScrollytellingScene.js` (422 lines), R3F + expo-gl, two GLBs, offline optimisation pipeline (26 MB → 3.6 MB). Real engineering, real risk (see §3). |
| Location | `useDeliveryLocation` — permission → GPS → reverse geocode → Nagpur fallback at every failure. |

### Repo-level

- Monorepo with a root `package.json`, `ARCHITECTURE.md`, heavy `.claude/` tooling.
- `vendor-app/` has been deleted from the working tree — the unified-binary decision is real but uncommitted.
- **Zero tests. Zero CI. No lint gate. No admin surface of any kind.**

---

## 2. The load-bearing gaps

Ordered by how badly each one blocks a real launch.

### P0 — the app cannot transact

1. ~~**No authentication.**~~ **Done.** `useAuthStore` is wired to Firebase
   Auth (email/password) with AsyncStorage session persistence. `AuthScreen`
   provides sign-up and sign-in, reachable from the marketing CTA; the role is
   read from the account's Firestore `users/{uid}` profile, and the Firebase ID
   token flows to the backend through the existing `setAuthToken` seam. See
   [customer-app/AUTH.md](../customer-app/AUTH.md). `extra.devAuthToken` remains
   only as a manual override for backend testing. Still open: payments and the
   customer data path below.
2. **No payments.** Orders are created with a client-supplied `totalPrice` and
   no payment object. A customer cannot pay; the platform cannot collect.
3. **Customer app is running on mock data.** `mockStores.js` (338 lines) feeds
   Home, ProductDetail, Cart and LiveTracking. `vendorApi.js` exposes **no**
   customer endpoints — no nearby vendors, no product fetch, no order create.
   The buyer flow and the backend have never spoken to each other.
4. **`totalPrice` is trusted from the client.** Anyone can post an order for
   ₹1. Price must be recomputed server-side from the catalogue.
5. **Stock is never decremented.** `Product.sizes[].stock` exists and nothing
   writes to it. Two customers can buy the same last shirt. There is no
   reservation, no transaction, no oversell guard.
6. **Multi-vendor cart vs single-vendor order.** `useCartStore` happily accepts
   items from five different shops; `Order.vendor` is a single `ObjectId`. The
   checkout has no defined behaviour. This is a product decision, not a bug fix
   — see [03](03-ADMIN-AND-ECONOMICS.md) §"Cart policy".
7. **Live tracking is a simulation.** `buildRoute` interpolates a fake driver
   along a bent line on a `TICK_MS` timer. No Porter tracking, no socket, no
   real coordinates, no vendor-side view of the same trip.

### P1 — no money model, no operations

8. **No commission, no delivery fee, no taxes, no payouts.** `Order` stores one
   `totalPrice`. There is no line-item breakdown, no platform take, no GST, no
   vendor ledger. The business does not exist in the schema.
9. **No admin panel.** No QC queue, no vendor onboarding, no order board, no
   pricing controls, no refunds, no staff accounts, no audit log.
10. **No product QC / moderation.** `POST /api/products` publishes straight to
    the storefront. A vendor can list anything, at any price, with any photo.
11. **No image upload anywhere.** `Product.images` is `[String]` and no client
    or bot can put a file behind those strings. Catalogue creation is
    impossible in practice.
12. **No vendor onboarding or KYC.** `POST /api/vendors/sync` will mint a
    vendor for any authenticated Firebase uid. No GSTIN, no PAN, no bank
    account, no shop verification, no contract acceptance.
13. **No order cancellation, refund, return or exchange.** For a clothing
    business this is not an edge case — fit failure is the dominant return
    reason and there is no path for it.
14. **No notification escalation.** WhatsApp is fire-and-forget with a
    `console.error` on failure. For a 45-minute SLA, an unread WhatsApp is a
    dead order. No SMS, no voice call, no auto-reassign, no timers.
15. **No push notifications.** FCM is named in `ARCHITECTURE.md` and appears
    nowhere in the code. No device token storage, no send path.

### P2 — no customer surface area

16. No search, no filters, no sort, no category browse, no pagination.
17. No order history, no reorder, no order detail for the customer.
18. No address book UI (the backend supports `savedAddresses`; nothing reads it).
19. No wishlist / save-for-later.
20. No ratings or reviews — for shop *or* product. `Vendor.rating` is a dead
    field defaulting to 0.
21. No size chart, no fit guidance, no measurements profile. Selling clothes
    without this is the single biggest conversion leak.
22. No coupons, referrals, loyalty, or first-order incentive.
23. No support/help surface, no order-level chat, no grievance contact
    (which is also a legal requirement in India — see [05](05-COMPLIANCE-AND-STORE-LAUNCH.md)).
24. No onboarding, no empty states, no error states, no skeletons, no offline
    handling, no retry affordances beyond the location header.

### P3 — engineering hygiene

25. **No input validation** anywhere. Every controller spreads `req.body`
    straight into Mongoose (`createProduct` does `{ ...req.body, vendor }` —
    a vendor can set arbitrary fields).
26. **No rate limiting, no helmet, no CORS allowlist, no request size cap.**
27. **WhatsApp webhook signature is never verified.** `X-Hub-Signature-256`
    is ignored — anyone who finds the URL can POST to it.
28. **No idempotency.** Meta retries webhooks; Porter retries; a double-tapped
    checkout creates two orders.
29. **No env validation at boot.** A missing `META_WHATSAPP_TOKEN` fails at the
    first customer order, in production, silently.
30. **No structured logging, no error tracking, no metrics, no uptime checks.**
31. **No tests, no CI, no lint gate, no type checking** (`tsconfig.json` exists;
    the app is plain `.js`).
32. **No EAS build profiles, no app signing plan, no OTA update channel, no
    versioning/release process.** `bundleIdentifier` is still
    `com.anonymous.customer-app` and the slug is `customer-app`.
33. **No accessibility work** — no labels, no dynamic type, no contrast audit,
    no reduce-motion handling (critical given the 3D scene).
34. **No localisation.** Nagpur is a Hindi/Marathi city; the app is
    English-only, including the vendor side where it matters most.

---

## 3. Two decisions that need to be made before Phase 1

### 3a. The 3D scrollytelling scene

It is the most distinctive thing in the codebase and the biggest production
risk. 3.6 MB of GLB plus an expo-gl context on a ₹9,000 Android phone means a
slow cold start, high memory, and battery drain — on the *first screen*, which
is exactly where a quick-commerce app is judged.

Recommendation: **keep it, move it.** Promote it to a first-run cinematic and a
deliberate "Chapter" entry point, not the thing standing between a returning
customer and the buy button. Details in
[01-PRODUCT-IDENTITY.md](01-PRODUCT-IDENTITY.md) §"The 3D question".

### 3b. Unified binary vs split apps

The unified binary is currently the right call — one build pipeline, one
review cycle, one codebase, and a vendor is often also a customer. Keep it
through launch. Revisit only when the vendor flow needs background location or
a foreground service that a customer build should not ship.

Note for store review: a single app with a role switch is fine, but the
**Vendor Mode toggle in Profile must be removed or gated behind a real vendor
account before submission**. A reviewer flipping into an empty order desk reads
as a broken app.

---

## 4. What to preserve

Not everything needs rewriting. These are already right:

- `transitionToReady` — persist-then-dispatch with `allSettled`, and the
  deliberate non-terminal `READY_FOR_PICKUP` retry state.
- The single token seam (`setAuthToken` called only by the auth store).
- `toError` / `request` in `vendorApi.js` — server messages reach the UI intact.
- Role-keyed `NavigationContainer` remount.
- The GLB optimisation pipeline and its documented reasoning.
- `useDeliveryLocation`'s degrade-to-Nagpur-centre behaviour at every failure.
- The monochrome palette discipline ("no hue outside this file").
