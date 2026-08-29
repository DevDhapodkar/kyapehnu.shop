# Kya Pehnu?

> **Hyper-local fashion delivery for Nagpur.** Order clothes from independent
> neighbourhood shops and have them at your door in minutes — the
> Swiggy/Zomato model, applied to fashion.

Kya Pehnu? (Hindi/Marathi for *"What should I wear?"*) is a hyper-local
fashion delivery aggregator for independent clothing retailers in Nagpur,
India. Buyers discover clothing from the shops physically nearest to them,
place an order, and a rider brings it over — and, if it doesn't fit, waits
while they try it on. Shopkeepers list and manage their inventory by sending
a photo to WhatsApp, and get real-time order alerts on the same app their
customers use.

The product is deliberately styled as a minimalist luxury shopping
experience: an obsidian/charcoal monochrome palette, heavy glassmorphism, and
a 3D scrollytelling intro that orbits a men's outfit and a red dress as you
scroll.

---

## How it works

```
  Customer                    Backend                      Vendor
  ────────                    ───────                      ──────
  Browse shops    ──────►  index nearby items
  nearest to GPS
                                                   ◄──  list inventory
                                                        via WhatsApp photo
  Place order     ──────►  create order      ──────►  real-time alert
                                                        (push → WhatsApp)
                           ◄────────────────  "Mark Ready for Pickup"
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                              ▼
              Porter dispatch                WhatsApp confirmation
              (rider assigned)               (to vendor's phone)
                     │
  Live map      ◄────┘
  tracking
```

One order flows from a buyer, to a shopkeeper's phone, to a dispatched rider —
with the customer watching it move on a live map the whole way.

---

## Monorepo layout

| Path            | What it is                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| `/backend`      | Node.js/Express API — logistics, MongoDB, auth, webhooks, and a same-origin admin panel.                     |
| `/customer-app` | React Native (Expo) app. **One unified binary** serving both buyers and shop owners.                         |
| `/docs`         | Product & engineering planning documents — current state, product identity, integrations, roadmap.           |
| `setup.sh`      | One-shot cloud/dev environment bootstrap (installs all deps, scaffolds `backend/.env`).                       |

### One app, two audiences

There is **no separate vendor binary**. A shop owner and a buyer install the
same app; the backend profile behind their Firebase account decides which flow
they land in. The `role` field (`CUSTOMER` | `VENDOR`) in
`customer-app/src/store/useAuthStore.js` is the only switch —
`AppNavigator` mounts the Customer Flow or the Vendor Flow from it. Vendor
screens live under `customer-app/src/screens/vendor/`.

---

## Design system

Every screen is built from one set of primitives, so the buyer's storefront and
the shopkeeper's order desk read as the same product.

| Path                              | What it is                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/theme/colors.js`             | Raw palette — obsidian surfaces, ivory type, crimson (actions) and gold (provenance).        |
| `src/theme/tokens.js`             | The decisions made with them: type scale, motion curves, elevation presets, gradient ramps.  |
| `src/components/ui/`              | The primitives — `Surface`, `Button`, `Chip`, `TextField`, `StatTile`, `Skeleton`, `Icon`, … |
| `src/components/ui/index.js`      | The system's public surface. Screens import from here, never from individual files.          |
| `scripts/brand/generate.mjs`      | Rasterises the hanger mark into every icon, splash, favicon, and in-app logo variant.         |

Three rules hold the look together:

- **Crimson is only ever an action.** State is signalled by fill weight and by
  gold (needs you) or jade (settled) — never by turning something red.
- **Motion is feedback, not decoration.** Presses are springs, lists stagger in,
  loading is a skeleton rather than a spinner, and every animation passes
  `ReduceMotion.System` so an OS-level motion preference is respected.
- **Chrome is opaque.** There is no native backdrop blur, so headers and docked
  bars separate from the page through a hairline border, a specular top edge,
  and a shadow — not through transparency that would let content ghost through
  behind a price.

Brand artwork is generated, never hand-edited:

```bash
cd customer-app && node scripts/brand/generate.mjs
```

---

## Tech stack

| Layer            | Technologies                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Mobile app**   | Expo (SDK 57), React Native 0.86, React 19, React Navigation, Zustand, React Native Reanimated                 |
| **Design system**| `expo-linear-gradient`, `@expo/vector-icons` (Feather), `expo-haptics` — see [Design system](#design-system)   |
| **3D / graphics**| React Three Fiber (R3F), drei, three.js, `expo-gl` — scroll-driven 3D intro                                     |
| **Maps & location** | `react-native-maps`, `expo-location`, OpenStreetMap tiles + pin-address geocoding                           |
| **Backend**      | Node.js, Express 5, MongoDB Atlas (Mongoose), ES modules                                                        |
| **Auth**         | Firebase Auth (customers/vendors) + Firebase Cloud Messaging (push); JWT for the admin panel                    |
| **Media**        | Cloudinary (product image storage + CDN), Multer uploads                                                        |
| **Integrations** | WhatsApp Cloud API (Meta) for vendor inventory + order alerts; Porter API for rider dispatch                    |

---

## Key features

### Customer app
- **3D scrollytelling home** — a drone-shot camera tied to scroll position,
  orbiting a 3D outfit. Assets are optimized from 26 MB of source GLBs down to
  a shipped 3.6 MB (`npm run models:optimize`).
- **Nearby-first discovery** — auto-fetch GPS location and index clothing from
  the closest local shops.
- **Full e-commerce loop** — Product Detail Pages, global cart, checkout, and
  order history.
- **Live delivery tracking** — watch the assigned rider move on a map in
  real time.

### Vendor flow (same app)
- **Catalog management** — add and manage products and inventory, including
  by sending a photo to WhatsApp.
- **Real-time order alerts** — new orders arrive as push notifications, with a
  WhatsApp message to the vendor's phone.
- **Order lifecycle** — Accept, then **Mark Ready for Pickup**, which issues
  `POST /api/orders/:orderId/ready` and fans out to Porter (rider dispatch) and
  WhatsApp (confirmation) in parallel.

### Admin panel
- A same-origin static console served by the backend at `/admin`, talking to
  `/api/admin`. Operators can create shops, add live products, and manage
  orders — no separate host, no CORS.

### Web storefront
- The backend also serves a guest storefront supporting cash-on-delivery
  checkout and order tracking with no account required
  (`POST /api/orders/guest`, `GET /api/orders/track`).

---

## Getting started

### Prerequisites
- **Node.js ≥ 20.19.4**
- A **MongoDB Atlas** connection string (backend)
- For a full end-to-end setup: Firebase, Cloudinary, WhatsApp Cloud API, and
  Porter credentials (all optional to *boot* — missing creds just disable the
  matching feature with a `503`, they don't stop the server)

### 1. Install everything

```bash
./setup.sh
# or, equivalently:
npm run install:all
```

This installs dependencies for the monorepo root, the backend, and the
customer app, then scaffolds `backend/.env` from `backend/.env.example`.

### 2. Configure the backend

Fill in `backend/.env` with real values. See `backend/.env.example` for the
full annotated list. At minimum you'll want `MONGO_URI`; Firebase, Cloudinary,
WhatsApp, and Porter creds unlock their respective features.

> **Port note:** the backend defaults to **5001**, not 5000 — on macOS the
> AirPlay Receiver squats on 5000 and answers with a `403` that looks exactly
> like an auth bug. Keep `customer-app/app.json`'s `expo.extra.apiBaseUrl`
> pointing at whatever port you choose.

### 3. Run in development

```bash
npm run dev
```

This runs the Express backend and the Expo app together (via `concurrently`).
To run them individually:

```bash
npm run dev:backend   # Express with --watch
npm run dev:app       # Expo dev server
```

The Expo output offers a QR code / options to open the app in a development
build, an Android emulator, an iOS simulator, or Expo Go.

---

## Backend API surface

All routes are mounted in `backend/server.js`:

| Route prefix       | Responsibility                                             |
| ------------------ | ---------------------------------------------------------- |
| `/api/users`       | Customer accounts and profiles                             |
| `/api/vendors`     | Shop/vendor accounts and registration                      |
| `/api/products`    | Catalog / inventory                                        |
| `/api/orders`      | Order lifecycle, guest checkout, tracking, Porter dispatch |
| `/api/whatsapp`    | WhatsApp Cloud API webhook (inventory bot + notifications) |
| `/api/uploads`     | Cloudinary-backed image uploads                            |
| `/api/admin`       | Admin console API (JWT-protected)                          |
| `/health`          | Liveness probe (`{ "status": "ok" }`)                      |
| `/admin`           | Static admin panel (`admin.html`)                          |

**Data models** (`backend/models/`): `User`, `Vendor`, `Product`, `Order`,
`Admin`.

---

## Building the Android APK

A prebuilt, installable APK (`kya-pehnu.apk`) is produced by the
**Build Android APK** GitHub Actions workflow
(`.github/workflows/build-apk.yml`) and committed to the repo root.

- Trigger it from the **Actions** tab → *Build Android APK* → *Run workflow*.
- The build runs on GitHub's runners (which have the Android SDK and open
  network access) and assembles an **arm64-v8a** release APK — every modern
  phone, and small enough to stay under GitHub's 100 MB push limit.
- It's signed with the React Native template's debug keystore, so it installs
  on any device with "install unknown apps" enabled.

---

## Documentation

The `/docs` directory holds the product and engineering plan. Start with
[`docs/README.md`](docs/README.md), which indexes:

| Doc | What it covers |
| --- | --- |
| [State of the App](docs/00-STATE-OF-THE-APP.md) | What exists today and the gaps to production. **Read first.** |
| [Product Identity](docs/01-PRODUCT-IDENTITY.md) | Typography, colour, the fabric-physics motion system, signature features. |
| [Integrations](docs/02-INTEGRATIONS.md) | WhatsApp inventory bot, notification escalation ladder, Porter, payments. |
| [Admin & Economics](docs/03-ADMIN-AND-ECONOMICS.md) | Admin modules, pricing/commission engine, unit economics. |
| [Infrastructure](docs/04-INFRASTRUCTURE.md) | The free-tier stack, environments, release engineering. |
| [Compliance & Store Launch](docs/05-COMPLIANCE-AND-STORE-LAUNCH.md) | Security, reliability, Indian regulation, app-store review. |
| [Roadmap Phases](docs/06-ROADMAP-PHASES.md) | Nine phases (~22 weeks) with exit criteria and a risk register. |

For the system blueprint and design system, see
[`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Project status

Kya Pehnu? is in **active development toward a Nagpur pilot launch** — not yet
production. The moat is supply, not software: local shopkeepers who can list
inventory from their phone, and a rider who waits while you try the shirt on.
See [`docs/00-STATE-OF-THE-APP.md`](docs/00-STATE-OF-THE-APP.md) and
[`docs/06-ROADMAP-PHASES.md`](docs/06-ROADMAP-PHASES.md) for the honest
current state and the phased plan.

---

## License

This is a private project. The `customer-app` scaffold retains the MIT license
from the Expo starter template it was generated with (see
[`customer-app/LICENSE`](customer-app/LICENSE)).
