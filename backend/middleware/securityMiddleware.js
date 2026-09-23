import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * Whitelist of allowed origins for cross-origin browser requests.
 * Native mobile apps (Expo / React Native) and curl send no Origin header
 * and are permitted by default.
 */
const ALLOWED_ORIGINS = [
  'https://kyapehnu.shop',
  'https://www.kyapehnu.shop',
  'https://kyapehnu.website',
  'https://www.kyapehnu.website',
  'https://kya-pehnu.vercel.app',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5001',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:8081',
];

/**
 * Secure CORS Middleware
 */
export const corsSecurity = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin) || (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Wipe-Secret', 'expo-platform', 'expo-current-update-id'],
  maxAge: 86400, // 24 hours
});

/**
 * HTTP Security Headers Middleware via Helmet
 */
export const helmetSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'https://cdn.tailwindcss.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows OTA updates and public asset serving
  frameguard: { action: 'sameorigin' }, // Prevents clickjacking
  hidePoweredBy: true, // Disables X-Powered-By: Express
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  noSniff: true, // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * General API Rate Limiter: 120 requests per minute per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after a minute.' },
});

/**
 * Strict Auth & Admin Rate Limiter: 10 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

/**
 * Guest Checkout Rate Limiter: 15 requests per 15 minutes
 */
export const guestCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many orders placed. Please try again shortly.' },
});

/**
 * Guest Tracking Rate Limiter: 30 requests per minute
 */
export const guestTrackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many tracking queries. Please wait a minute.' },
});

/**
 * NoSQL Injection Sanitizer: Recursively scrubs keys starting with `$` or containing `.`
 */
export const sanitizeNoSql = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};
