# 04 — Infrastructure: Free-Tier First, With Honest Limits

Goal: run the whole platform on free tiers until real order volume, without
building anything that has to be thrown away when it stops being free.

Rule of thumb: **free is fine for storage, compute, and analytics. Free is not
fine for the always-on request path of a 45-minute delivery promise.** Budget
~$7–15/month for the one thing that must never cold-start.

---

## 1. The stack

| Layer | Choice | Free tier | Ceiling / when it breaks |
| --- | --- | --- | --- |
| **API** | Fly.io (shared-cpu-1x, 256 MB) or Render | Fly: generous small-instance allowance. Render free spins down after 15 min idle | **Render's free tier cold start is 30–50 s. Unusable for order alerts.** Either Fly with `min_machines_running = 1`, or Render's $7 plan. Treat this as the one paid line item. |
| **Database** | MongoDB Atlas M0 | 512 MB, shared CPU | ~50–100k orders with images externalised. Move to M10 (~$57/mo) at real scale, or Atlas Serverless. |
| **Object storage** | Cloudflare R2 | 10 GB storage, **zero egress fees** | Egress-free is the decisive property — product images are read constantly. Cloudinary (25 GB + transforms) is the faster build; R2 + a Worker for resizing is the cheaper long run. Start Cloudinary, plan the R2 migration behind an uploader interface. |
| **Image transforms** | Cloudinary or Cloudflare Images | Cloudinary 25 monthly credits | Or pre-generate three sizes with `sharp` at upload time (the app already depends on sharp) and skip transform services entirely. **Recommended** — deterministic, free, no vendor lock. |
| **Auth** | Firebase Auth | Email/Google free. **Phone/OTP is billed per SMS** | Phone auth is the right UX for India and it is *not* free. ~₹0.30–0.50 per verification. Budget it, and rate-limit OTP requests hard (a leaked endpoint is a direct bill). |
| **Push** | FCM + Expo Push | Unlimited, free | None. |
| **Realtime (driver position)** | Firebase Realtime DB | 1 GB stored, 10 GB/mo transfer | Write only a compact `{lat,lng,at}` per trip and delete on completion. At 300 orders/day this is nowhere near the limit. |
| **Delayed jobs / escalations** | Upstash QStash | 500 messages/day free | The escalation ladder is ~4 scheduled callbacks per order → ~125 orders/day on free. Upgrade (~$10/mo) or self-schedule via a 1-minute cron sweep over a `due_at` index in Mongo. **The Mongo sweep is free and adequate — prefer it.** |
| **Cache / locks / rate-limit** | Upstash Redis | 10k commands/day | Used for WhatsApp session locks, Porter quote cache, and rate limiting. Fine at launch. |
| **Admin web** | Vercel or Cloudflare Pages | Hobby free | Vercel Hobby forbids commercial use — **use Cloudflare Pages for an admin panel that runs a business.** |
| **Error tracking** | Sentry | 5k errors/mo | Covers backend + RN. Set sampling. |
| **Logs** | Axiom or BetterStack | 500 MB/mo | Structured JSON logs via pino. Never log PII, tokens, or full webhook bodies. |
| **Uptime** | BetterStack / UptimeRobot | 10 monitors free | `/health` plus a synthetic "can we create an order" probe. |
| **Product analytics** | PostHog Cloud | 1M events/mo | Ample. Add Firebase Analytics for store-console attribution. |
| **CI** | GitHub Actions | 2,000 min/mo | Lint + test + typecheck on PR. EAS builds run on EAS, not here. |
| **Mobile builds** | EAS | Limited free builds/mo | Or build locally (Xcode/Android Studio) and use EAS only for store submission. Budget the $19/mo Production plan around launch week. |
| **Email** | Resend | 3k/mo, 100/day | Invoices, payout statements, admin alerts. |
| **Maps** | See §2 | — | The single most likely surprise bill. |

**Realistic monthly cost at launch (0–500 orders/day): ₹1,500–3,000
(~$20–35).** Dominated by the always-on API instance, phone-auth OTPs, and
WhatsApp utility templates.

---

## 2. Maps — the cost trap

`react-native-maps` with `PROVIDER_GOOGLE` plus Places autocomplete plus
Directions is the fastest build and the fastest way to a four-figure bill.
Google's per-SKU free allowances are consumed quickly by an app that renders a
live map for every order.

Recommended split:

- **Map rendering:** MapLibre (`@maplibre/maplibre-react-native`) with free
  vector tiles (OpenFreeMap, Protomaps self-hosted on R2, or a MapTiler free
  key). **Zero per-view cost**, and it takes a custom style — the existing
  `obsidianMapStyle` intent ports directly, and a bespoke dark map is *better*
  for the brand than Google's.
- **Address autocomplete:** Google Places or Ola Maps (Indian, cheaper, better
  local POI data), heavily debounced and session-tokened, with results cached.
- **Geocoding / reverse geocoding:** cache aggressively in Mongo keyed by
  geohash. The same 200 Nagpur neighbourhoods repeat forever.
- **Routing/ETA:** take it from Porter's response. Do not pay twice.

This decision should be made in Phase 1, before map code proliferates.

---

## 3. Storage and data hygiene

- **Images:** originals never served. Three derivatives (`1200×1600`,
  `600×800`, `200×267`) in WebP, generated at upload with sharp, served from
  the CDN with immutable cache headers and content-hashed filenames.
- **3D assets:** already handled well. Keep them out of the OTA bundle — host
  the GLBs on the CDN and download-and-cache on first run so the initial app
  download stays small.
- **Mongo document budget:** never embed images or logs in order documents.
  Orders stay small; `AuditLog`, `Notification`, and `WhatsappInbound` get TTL
  indexes (90 / 30 / 7 days).
- **Indexes needed beyond the existing geo ones:** `Order` on
  `{vendor, status, createdAt}`, `{customer, createdAt}`, `{status, createdAt}`;
  `Product` on `{vendor, status}`, `{status, category, isAvailable}`, and a
  text index on `name`/`description` for search; unique on
  `WhatsappInbound.messageId` and on the idempotency key.
- **Backups:** M0 has no automated backup. Run a nightly `mongodump` from a
  GitHub Action into R2, encrypted, with a 30-day retention. **Test the
  restore once before launch.** An untested backup is not a backup.

---

## 4. Environments

Three, minimum:

| Env | Purpose | Notes |
| --- | --- | --- |
| `local` | Development | Docker Mongo or a second M0, Meta test number, Porter UAT, Razorpay test keys. |
| `staging` | Pre-release + store review builds | Its own Atlas cluster, its own Firebase project, all third parties in sandbox. Store reviewers get a demo account that works here or on a seeded production tenant. |
| `production` | Real | Separate keys everywhere, separate Firebase project, no shared secrets with staging. |

Secrets live in the platform's secret store (Fly secrets / Render env / GitHub
Actions secrets). `.env.example` stays a documentation file. Add a **boot-time
env schema validation** (zod) that refuses to start with a missing or malformed
variable — the current code discovers a missing WhatsApp token at the first
customer order.

---

## 5. Release engineering

- **Versioning:** semver on the app, `runtimeVersion` policy tied to the native
  build so OTA updates can never land on an incompatible binary.
- **EAS channels:** `development`, `preview` (internal testers), `production`.
- **OTA (`expo-updates`):** JS-only fixes ship in minutes without a store
  review. Both stores permit this for bug fixes and content; **do not use it to
  change app behaviour or add features that bypass review** — that is a policy
  violation and a takedown risk.
- **Staged rollout:** Play Store staged rollout at 10% → 50% → 100%, gated on
  crash-free sessions and the order-success metric.
- **Identifiers to fix before the first build:** `com.anonymous.customer-app`
  → `in.kyapehnu.app`, slug `customer-app` → `kyapehnu`, and the display name.
  Bundle ids are effectively permanent; changing one after publishing means a
  new store listing and the loss of every install.
- **Kill switch:** a remote-config minimum-version gate so a broken build can
  be forced to update, and a "pause new orders" flag readable by the app.
