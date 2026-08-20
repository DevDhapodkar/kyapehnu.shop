# 10 — Deploying the backend (free)

The API is deploy-ready for **Render** (free web service, **no credit card**).
A `render.yaml` blueprint at the repo root configures everything; you just paste
a few secrets.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/DevDhapodkar/kyapehnu.shop)

> The one-click button reads `render.yaml` from the repo's **default branch**
> (`main`). Since the code is currently on
> `claude/production-readiness-features-iaszws`, either **merge that branch to
> `main` first**, or use the dashboard flow below and **select that branch** when
> Render asks — the dashboard lets you choose which branch to read the blueprint
> from.

## Step 1 — a free database (MongoDB Atlas M0)

1. [cloud.mongodb.com](https://cloud.mongodb.com) → create a free **M0** cluster
   (it's a replica set, so order transactions work). No card required.
2. **Database Access** → add a user + password.
3. **Network Access** → **Allow access from anywhere** (`0.0.0.0/0`). Render's
   egress IPs aren't fixed on the free plan, so this is the simplest option.
4. **Connect → Drivers** → copy the `mongodb+srv://…` string. That's `MONGO_URI`.

## Step 2 — deploy to Render

1. Click the **Deploy to Render** button above (or Render dashboard → **New →
   Blueprint** → pick this repo). Render reads `render.yaml`.
2. It prompts for the `sync:false` env vars — paste at least:
   - **`MONGO_URI`** (from step 1) — required.
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — for
     real sign-in (paste the key with literal `\n`, in quotes).
   - `CLOUDINARY_*` — optional, for product image uploads.
   - `ADMIN_JWT_SECRET` is auto-generated; the deferred flags default to `false`.
3. **Create** → Render runs `npm ci --omit=dev` then `npm start`, and health-checks
   `/health`. First deploy takes a couple of minutes.
4. Your API URL is `https://kyapehnu-backend.onrender.com` (name may vary).
   Open `…/health` — it should return `{"status":"ok", …}`.

> The blueprint deploys the `claude/production-readiness-features-iaszws` branch.
> After you merge to `main`, change `branch:` in `render.yaml` (or the service
> settings) to `main`.
>
> Free instances **sleep after ~15 min idle** and cold-start (~50s) on the next
> request — fine for a pilot. Alternatives with no sleep: **Koyeb** (free, no
> card) or **Fly.io** (free allowance, needs a card).

## Step 3 — create the first admin

From your machine, pointed at the same Atlas DB:

```bash
cd backend
MONGO_URI='<your atlas uri>' ADMIN_EMAIL='ops@kyapehnu.shop' \
ADMIN_PASSWORD='a-strong-password' npm run seed:admin
```

Then sign in at `https://<your-service>.onrender.com/admin`.
(Optional: `npm run seed` also loads demo shops/products.)

## Step 4 — point the app at the deployed API

In `customer-app/app.json`, set:

```json
"extra": { "apiBaseUrl": "https://kyapehnu-backend.onrender.com" }
```

Commit and rebuild the APK (the GitHub Action rebuilds on push to
`customer-app/**`). The app will now talk to your live backend.

## What's wired for you

- `render.yaml` — service, region (Singapore, closest to Nagpur), build/start,
  `/health` check, and all env var slots.
- `backend/package.json` declares `engines.node >=20` so Render picks a
  compatible runtime; the server already reads `process.env.PORT` and binds all
  interfaces, so it works on Render unchanged.
