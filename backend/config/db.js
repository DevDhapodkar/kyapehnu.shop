import mongoose from 'mongoose';
import { log } from '../lib/logger.js';

/**
 * Connect to MongoDB with production-grade options and a bounded retry loop.
 *
 * - Pool + timeout settings tuned for a small always-on API.
 * - Connection lifecycle events are logged (disconnect/reconnect/error) so an
 *   outage is visible rather than silent.
 * - Retries the initial connect a few times with backoff before giving up —
 *   avoids a crash-loop when Mongo is briefly unreachable at boot.
 * - `syncIndexes()` after connect so the unique indexes the app relies on
 *   (idempotency key, order number, invoice number, emails) actually exist.
 */
const CONNECT_OPTS = {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 20,
  minPoolSize: 2,
  retryWrites: true,
};

const MODELS_TO_INDEX = [
  'User',
  'Vendor',
  'Product',
  'Order',
  'Invoice',
  'Admin',
  'Counter',
  'PlatformSetting',
];

const wireConnectionEvents = () => {
  const c = mongoose.connection;
  c.on('disconnected', () => log.warn('MongoDB disconnected'));
  c.on('reconnected', () => log.info('MongoDB reconnected'));
  c.on('error', (err) => log.error('MongoDB connection error', { error: err.message }));
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const connectDB = async (uri = process.env.MONGO_URI, { retries = 4, syncIndexes = true } = {}) => {
  if (!uri) throw new Error('MONGO_URI is required to connect to the database');

  wireConnectionEvents();

  let attempt = 0;
  for (;;) {
    try {
      const conn = await mongoose.connect(uri, CONNECT_OPTS);
      log.info('MongoDB connected', { host: conn.connection.host, db: conn.connection.name });

      if (syncIndexes) {
        // Best-effort: build declared indexes so unique constraints are enforced.
        await Promise.all(
          MODELS_TO_INDEX.filter((n) => mongoose.models[n]).map((n) =>
            mongoose.models[n].syncIndexes().catch((err) =>
              log.warn(`Index sync failed for ${n}`, { error: err.message })
            )
          )
        );
      }
      return conn;
    } catch (error) {
      attempt += 1;
      if (attempt > retries) {
        log.error('MongoDB connection failed after retries; exiting', {
          attempts: attempt,
          error: error.message,
        });
        process.exit(1);
      }
      const backoff = Math.min(2 ** attempt * 1000, 16_000);
      log.warn('MongoDB connect failed; retrying', { attempt, backoffMs: backoff, error: error.message });
      await sleep(backoff);
    }
  }
};

export default connectDB;
