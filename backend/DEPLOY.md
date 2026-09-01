# Deploying the backend to Fly.io

The API is a stateless Express server (auth via Firebase/JWT, images streamed to
Cloudinary, data in MongoDB Atlas). It ships as a Docker image and runs on Fly
in **Mumbai (`bom`)**, always-on so there is no cold start.

Files that make this work: [`Dockerfile`](./Dockerfile),
[`fly.toml`](./fly.toml), [`.dockerignore`](./.dockerignore).

## One-time setup

1. **Install the CLI and sign in**
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   fly auth signup      # or: fly auth login
   ```

2. **Create the app** (run from the `backend/` directory). `--no-deploy` so we
   can set secrets before the first boot.
   ```bash
   cd backend
   fly launch --no-deploy --copy-config --name kyapehnu-backend --region bom
   ```
   - Keep the existing `fly.toml` when prompted.
   - If the name `kyapehnu-backend` is taken, pick another and update `app` in
     `fly.toml` (and the app URL in step 5).

3. **Set secrets** (never commit these — they live only in Fly). Either set them
   one by one:
   ```bash
   fly secrets set \
     MONGO_URI='mongodb+srv://USER:PASS@CLUSTER.mongodb.net/kyapehnu' \
     FIREBASE_PROJECT_ID='...' \
     FIREBASE_CLIENT_EMAIL='...' \
     FIREBASE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' \
     ADMIN_JWT_SECRET='<long-random-string>' \
     ADMIN_EMAIL='...' ADMIN_PASSWORD='...' ADMIN_NAME='Admin' \
     CLOUDINARY_CLOUD_NAME='...' CLOUDINARY_API_KEY='...' CLOUDINARY_API_SECRET='...' \
     META_PHONE_NUMBER_ID='...' META_WHATSAPP_TOKEN='...' META_WEBHOOK_VERIFY_TOKEN='...' \
     PORTER_API_KEY='...'
   ```
   …or import a local env file that follows `.env.example` (keep the literal
   `\n`s in the Firebase key):
   ```bash
   fly secrets import < .env
   ```
   > Do **not** set `PORT` as a secret — `fly.toml` already pins it to 8080.

4. **Deploy**
   ```bash
   fly deploy
   ```
   Watch it come up, then confirm the health check:
   ```bash
   fly status
   curl https://kyapehnu-backend.fly.dev/health   # -> {"status":"ok"}
   ```

5. **Point the app at the new URL.** Edit
   `customer-app/app.json` → `expo.extra.apiBaseUrl` to
   `https://kyapehnu-backend.fly.dev` (or your app's URL), then rebuild the
   Expo app so shoppers hit Fly instead of Render.

## Everyday operations

```bash
fly deploy            # ship a new version (rolling, zero-downtime with 2+ machines)
fly logs              # tail logs
fly status            # machines, health, region
fly secrets list      # names only (values are write-only)
```

## Scaling

```bash
fly scale count 2               # two always-on machines -> HA + zero-downtime deploys
fly scale vm shared-cpu-2x      # bigger CPU
fly scale memory 1024           # more RAM
```

One `shared-cpu-1x` / 512 MB machine comfortably covers a single-city pilot; the
server is stateless, so scaling out is just `fly scale count N`.
