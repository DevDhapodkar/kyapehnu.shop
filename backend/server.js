import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import { loadEnv } from './config/env.js';
import connectDB from './config/db.js';
import { log } from './lib/logger.js';
import { notFoundHandler, errorHandler } from './lib/errors.js';

import userRoutes from './routes/userRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import adminRouter from './admin/router.js';

// Validate env at boot; refuse to start if a required var is missing.
const env = loadEnv();

const app = express();
app.set('trust proxy', 1); // correct client IP behind the platform proxy (rate limiting)

// The only HTML surface is the trusted, auth-gated admin portal (all user text
// is escaped via esc()); the API is JSON-only. Allow inline styles/scripts so
// the server-rendered admin pages render, keep the rest of helmet's defaults.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS: allowlist only. Native (Expo) clients send no Origin and are allowed;
// browsers must match the configured allowlist. No allowlist ⇒ non-browser only.
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // native app / server-to-server
      if (env.corsAllowlist.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Body parsing with a hard size cap. The webhook route needs the RAW bytes to
// verify Meta's HMAC signature, so we stash them on req.rawBody.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith('/api/whatsapp/webhook')) req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '256kb' })); // admin form posts
app.use(cookieParser());

// Rate limiting. A general limiter across the API, a tighter one on the two
// abuse-prone surfaces: order placement and admin login.
const generalLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
const adminLoginLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

app.use('/api', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/admin/login', adminLoginLimiter);

// Deep health check: also reports Mongo connectivity and feature flags.
app.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'up' : 'down',
    features: env.features,
    time: new Date().toISOString(),
  });
});

// API.
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Server-rendered admin portal.
app.use('/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// Never let an unhandled rejection/exception silently corrupt state.
process.on('unhandledRejection', (reason) => log.error('Unhandled promise rejection', { reason: String(reason) }));
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception; shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

const start = async () => {
  await connectDB(env.mongoUri);
  app.listen(env.port, () => log.info(`Server running`, { port: env.port, env: env.nodeEnv, features: env.features }));
};

// Don't auto-start under test; tests import the app/services directly.
if (env.nodeEnv !== 'test') start();

export default app;
