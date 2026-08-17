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
| `src/screens/AuthScreen.js` | The one login/sign-up surface. |

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

## Vendor Mode toggle

The switch on the Profile screen is a **local preview** that flips the navigator
to the vendor desk without a second account. It does not write to Firestore, so
the authoritative role is restored from the profile on the next launch.

## Tests

Pure auth logic is covered by Jest (`npm test`): validation rules, role
resolution, and error mapping. These modules import no React Native or Firebase
runtime, so the suite runs in plain Node.
