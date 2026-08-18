# Authentication

The app's login system is **Firebase Authentication** (email/password) with the
signed-in account's profile and role stored in **Cloud Firestore**. Both run on
Firebase's free Spark tier — no billing account is required for this app's
usage. The same Firebase ID token authenticates the Express/MongoDB backend,
which already verifies it with the Firebase Admin SDK.

## Why this shape

- **Free and production-grade.** Firebase Auth handles password hashing, reset
  flows, rate limiting, and session tokens — none of it hand-rolled.
- **The backend was already built for it.** `backend/middleware/authMiddleware.js`
  verifies Firebase ID tokens and resolves a Mongo profile by `firebaseUid`. The
  client just needed to start minting real tokens.
- **Firestore decides the role.** `users/{uid}.role` (`CUSTOMER` | `VENDOR`) is
  the single source of truth the navigator reads. A buyer and a shop owner
  install the same binary; their profile decides which flow they land in.

## Data flow

```
AuthScreen (email/password)
   │  signInWithEmail / signUpWithEmail
   ▼
useAuthStore ──► authService ──► Firebase Auth  (credential + session)
   │                        └──► Firestore users/{uid}  (name, phone, role)
   │
   ├─ onIdTokenChanged listener (initialize()):
   │     restores the persisted session on cold start,
   │     refreshes the ID token hourly,
   │     mirrors the token into the axios client via setAuthToken()
   │
   ▼
AppNavigator reads `role` → Customer flow or Vendor flow
```

Key files:

| File | Responsibility |
|------|----------------|
| `src/config/firebase.js` | Boots Firebase; Auth uses AsyncStorage persistence. Null until configured. |
| `src/auth/authService.js` | The only module that calls the Firebase SDK (Auth + Firestore). |
| `src/auth/roles.js` | `resolveRole` / `normalizeProfile` — pure, unit-tested. |
| `src/auth/validation.js` | Form validation — pure, unit-tested. |
| `src/auth/authErrors.js` | Firebase error code → friendly sentence — pure, unit-tested. |
| `src/store/useAuthStore.js` | Session state, the auth-state listener, sign-in/up/out actions. |
| `src/screens/AuthScreen.js` | The one login/sign-up surface (incl. password reset). |

## Setup

1. Create a Firebase project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Firestore Database →** create a database (production mode).
4. Deploy the security rules from the repo root:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Copy the web SDK config into the app. Either:
   - `cp .env.example .env` and fill in the `EXPO_PUBLIC_FIREBASE_*` values, **or**
   - set the same values under `expo.extra.firebase` in `app.json`.
6. `npm run start` (or `npm run android` / `npm run ios`).

If the keys are missing the app still boots — the sign-in screen shows a
"Firebase not configured" notice instead of crashing.

## Security model

- Firebase web config is a public **identifier**, not a secret. Access is
  enforced by Auth and by Firestore Security Rules (`firestore.rules`), never by
  hiding these values.
- A client may create its own profile **only as `CUSTOMER`** and can **never
  change its own role** — the rules block self-promotion. Vendor accounts are
  promoted out of band (Firebase console, or the backend via the Admin SDK,
  which bypasses rules).
- The ID token expires hourly; `onIdTokenChanged` keeps the copy the app sends
  to the backend fresh.

## Password reset

The sign-in screen has a **Forgot password?** link that calls Firebase's
`sendPasswordResetEmail`. Firebase hosts the reset page and the new-password
form, so there is nothing else to build. The confirmation is deliberately
neutral ("if an account exists…") so the response can't be used to tell which
emails are registered.

## Vendor accounts (apply → admin review → approve)

Vendors are **admin-approved, not self-serve**: signup only ever creates a
`CUSTOMER`, and the Firestore rules forbid a client from promoting itself. A
vendor account is two linked records — Firestore `users/{uid}.role = 'VENDOR'`
(gates the app into the order desk) and a MongoDB `Vendor` document (the shop
profile the vendor endpoints resolve).

### The flow

1. **Apply.** A signed-in customer opens Profile → **Sell on Kya Pehnu?** and
   fills the form (`VendorApplicationScreen`). It POSTs a `VendorApplication`
   (`POST /api/vendor-applications`) that lands in the review queue as `PENDING`.
   The screen then shows live status and lets them edit/resubmit.
2. **Review.** An admin opens the **admin panel at `/admin`** (served by the
   backend), sees the pending request with the whole submitted form, and can
   **edit any field**, then **Approve** or **Reject** (with a note).
3. **Approve.** Approval runs the provisioning service: it flips the Firestore
   role to `VENDOR` and creates/updates the `Vendor` document from the
   (possibly admin-edited) application. That account lands on the order desk on
   next launch. Rejection sends a reason back to the applicant.

### Admin panel setup

The panel is a static page the backend serves at `/admin`; it signs the admin in
with Firebase and calls the gated `/api/admin/*` routes. Grant admin rights by
either:

```bash
# quickest: list admin emails in backend/.env
ADMIN_EMAILS=you@example.com,partner@example.com

# or durably, per account (Firebase custom claim):
cd backend && npm run admin:set -- --email you@example.com
```

Then visit `http://<backend-host>/admin` and sign in with that Firebase account.

### Admin API

All under `/api/admin` (require a verified token **and** admin authority):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/vendor-applications?status=PENDING` | Review queue |
| GET | `/vendor-applications/:id` | Full submitted form |
| PATCH | `/vendor-applications/:id` | Edit any field |
| POST | `/vendor-applications/:id/approve` | Promote → create vendor |
| POST | `/vendor-applications/:id/reject` | Reject with a note |
| GET / PATCH | `/vendors`, `/vendors/:id` | Edit live shops |

### CLI alternative

The same promotion is available from the command line (bypasses the queue):

```bash
cd backend
npm run vendor:provision -- --email shop@example.com --profile ./scripts/vendor.example.json
npm run vendor:provision -- --email shop@example.com --demote   # revoke
```

For a quick **UI-only test** without the backend, edit the account's
`users/{uid}` doc in the Firestore console and set `role` to `VENDOR`.

## Vendor Mode toggle

The switch on the Profile screen is a **local preview** that flips the navigator
to the vendor desk without a second account. It does not write to Firestore, so
the authoritative role is restored from the profile on the next launch.

## Tests

Pure auth logic is covered by Jest (`npm test`): validation rules, role
resolution, and error mapping. These modules import no React Native or Firebase
runtime, so the suite runs in plain Node.
