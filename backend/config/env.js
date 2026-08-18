/**
 * Boot-time environment validation and typed config.
 *
 * Closes the "missing env fails silently at the first real order" gap: required
 * variables are checked here at startup and the process refuses to boot without
 * them (in production). Optional integrations expose a boolean `enabled` flag so
 * the rest of the app degrades gracefully — while company registration is in
 * progress, payments and Porter are simply off, and COD is the only tender.
 */

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const bool = (v, fallback = false) => {
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const int = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const REQUIRED_ALWAYS = ['MONGO_URI'];
// Firebase is required to verify customer/vendor tokens in a real deployment.
const REQUIRED_IN_PROD = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'ADMIN_JWT_SECRET',
];

/** Collect missing required keys; throw a single actionable error if any. */
const assertRequired = () => {
  const required = [...REQUIRED_ALWAYS, ...(isProd ? REQUIRED_IN_PROD : [])];
  const missing = required.filter((k) => !process.env[k] || process.env[k].trim() === '');
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Refusing to boot. See backend/.env.example.`
    );
  }
};

// Payments (gateway) and Porter both depend on the company registration that is
// still in progress, so they default OFF regardless of any stray creds.
const paymentsEnabled = bool(process.env.PAYMENTS_ENABLED, false);
const porterEnabled = bool(process.env.PORTER_ENABLED, false) && Boolean(process.env.PORTER_API_KEY);
// WhatsApp only fires if a token is actually present, so a half-configured
// environment never throws mid-order.
const whatsappEnabled =
  bool(process.env.WHATSAPP_ENABLED, false) &&
  Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID);

// Image uploads use Cloudinary (best free tier for images — no card required,
// CDN + auto-optimisation). Enabled whenever the three creds are present; the
// api_secret never leaves the server (signed direct-upload).
const imageUploadsEnabled = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

export const loadEnv = () => {
  assertRequired();

  return Object.freeze({
    isProd,
    isTest,
    nodeEnv: process.env.NODE_ENV || 'development',
    port: int(process.env.PORT, 5001),
    mongoUri: process.env.MONGO_URI,

    // Comma-separated allowlist for CORS; empty ⇒ same-origin/native only.
    corsAllowlist: (process.env.CORS_ALLOWLIST || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),

    admin: {
      jwtSecret: process.env.ADMIN_JWT_SECRET || (isProd ? '' : 'dev-admin-secret-change-me'),
      sessionHours: int(process.env.ADMIN_SESSION_HOURS, 12),
      cookieName: 'kp_admin_session',
    },

    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      configured: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL),
    },

    features: Object.freeze({
      payments: paymentsEnabled, // gateway; false ⇒ COD only
      porter: porterEnabled,
      whatsapp: whatsappEnabled,
      imageUploads: imageUploadsEnabled,
      codOnly: !paymentsEnabled,
    }),

    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || 'kyapehnu',
    },

    whatsapp: {
      phoneNumberId: process.env.META_PHONE_NUMBER_ID,
      token: process.env.META_WHATSAPP_TOKEN,
      verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
      appSecret: process.env.META_APP_SECRET, // for X-Hub-Signature-256 HMAC
    },

    porter: {
      apiKey: process.env.PORTER_API_KEY,
      baseUrl: process.env.PORTER_API_BASE || 'https://pfe-apigw-uat.porter.in/v1',
    },
  });
};

export default loadEnv;
