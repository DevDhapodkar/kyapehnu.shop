# Kya Pehnu?

**Hyper-local fashion delivery for Nagpur** — a Swiggy/Zomato-style marketplace
for independent clothing retailers. Customers shop from nearby shops and get
clothes delivered (with the option to try them on before paying); shopkeepers
manage inventory and fulfil orders from the same app.

Aesthetic: dark luxury — obsidian, crimson, and gold, with glassmorphism.

---

## What's live

| Surface | Where | Notes |
| --- | --- | --- |
| **Backend API** | `https://kyapehnu-backend.onrender.com` | Express + MongoDB Atlas, deployed on Render (auto-deploys `main`) |
| **Web storefront** | `/` on the backend | Guest checkout (COD), free OpenStreetMap pin-picker + order tracking — works in any mobile browser, no install |
| **Admin console** | `/admin.html` on the backend | First-run setup, shop/product management, order & QC queue |
| **Android app** | [`kya-pehnu.apk`](./kya-pehnu.apk) at the repo root | Real, installable release build (arm64-v8a); rebuilt by GitHub Actions |

---

## Repository layout (monorepo)

```
.
├── backend/          Express 5 (ESM) API — MongoDB, Firebase, Cloudinary, COD orders
│   ├── config/       Firebase Admin, Cloudinary, DB connection
│   ├── controllers/  Order / product / vendor / user / admin logic
│   ├── models/       Mongoose schemas (User, Vendor, Product, Order)
│   ├── routes/       REST endpoints (+ WhatsApp webhook stub)
│   ├── public/       Web storefront (index.html) + admin console (admin.html)
│   └── utils/        FCM push helper
├── customer-app/     Expo (React Native) — one binary for both customer & vendor flows
├── docs/             Product & engineering plan (roadmap, integrations, economics)
├── .github/workflows/build-apk.yml   Builds & commits the APK on GitHub runners
├── ARCHITECTURE.md   System blueprint
└── kya-pehnu.apk     Latest Android build
```

One app, two audiences: the `role` (`CUSTOMER` | `VENDOR`) on the backend
profile behind a user's Firebase uid decides which flow they land in — there is
no separate vendor binary.

---

## Tech stack (free-tier by design)

- **Backend:** Node 20+, Express 5, Mongoose 9, MongoDB Atlas, JWT + bcrypt.
- **Auth:** Firebase Authentication (email/password), verified server-side via
  `firebase-admin`.
- **Notifications:** local notifications (poll-driven, zero setup) work
  everywhere; remote push uses Firebase Cloud Messaging via the same service
  account — free and unlimited, no Expo/EAS project needed.
- **Images:** Cloudinary (uploads via `multer`).
- **Maps / location:** OpenStreetMap — Leaflet + Nominatim on the web, the
  device geocoder (`expo-location`) in the app. No API key, no cost.
- **App:** Expo SDK 57 / React Native, zustand, expo-notifications,
  expo-image-picker, expo-location.

---

## Features that work today

- Customer sign-in and vendor registration (Firebase auth).
- Vendor inventory management with rich product attributes (colours, sizes,
  description, net quantity, etc.).
- Cart and **Cash-on-Delivery** checkout (registered users and guests).
- GPS pin-drop delivery address with free reverse-geocoding to street + pincode.
- Order lifecycle: `PENDING → ACCEPTED → PACKED → READY_FOR_PICKUP → IN_TRANSIT
  → DELIVERED` (+ `CANCELLED`), reflected on the customer's "My Orders" and
  driven by the vendor.
- Order notifications that work **out of the box**: the app polls while open and
  raises a local notification when an order's status advances (customer) or a new
  order arrives (vendor) — no external setup needed. Remote FCM push layers on top
  once `google-services.json` is added (see below).
- Admin console for onboarding shops, curating products, and a QC queue.
- Live order-tracking map (OpenStreetMap).

---

## Getting started (local dev)

Requires Node ≥ 20.19.4.

```bash
# install everything (root + backend + app)
npm run install:all

# run backend + app together
npm run dev

# or individually
npm run dev:backend   # Express API on :5000 (see backend/.env)
npm run dev:app       # Expo dev server
```

Backend tests:

```bash
npm --prefix backend test    # node --test
```

### Backend environment variables

Set these in `backend/.env` locally and in the Render dashboard in production.
**Never commit secrets** — only the public Firebase *web* config (in
`customer-app/app.json`) is safe to check in.

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string (percent-encode special chars in the password) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Admin service account (auth + FCM push) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image uploads |
| `ADMIN_JWT_SECRET` | Signs admin console sessions |

Missing Firebase creds don't crash the server — auth and push simply answer
`503` until they're provisioned.

---

## Deployment

- **Backend + web + admin:** Render auto-deploys on every push to `main`.
- **Android APK:** the *Build Android APK* GitHub Actions workflow
  (`workflow_dispatch`) builds a real release APK on GitHub's runners (the
  sandbox has no Android SDK) and commits it to the repo root as
  `kya-pehnu.apk`.

### Upgrading to remote push on Android (optional, one manual step)

Order notifications already work via the local fallback. To also deliver
**remote** FCM pushes (so the app is notified even when closed), Android needs
the Firebase Android app config to route messages:

1. Firebase console → your project → **Add app → Android**.
2. Package name: **`com.dhapodkardev.kyapehnu`** (must match exactly).
3. Download **`google-services.json`** and drop it into `customer-app/`.
4. Rebuild the APK. `customer-app/app.config.js` wires the file in
   conditionally, so pushes go live automatically once it's present.

---

## Further reading

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the system blueprint.
- [`docs/`](./docs/README.md) — the full product & engineering plan (roadmap,
  integrations, admin economics, compliance, store launch).
</content>
</invoke>
