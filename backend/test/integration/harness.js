import mongoose from 'mongoose';

/**
 * Integration-test database harness. Connects the suite to a REAL MongoDB so the
 * transactional order path, atomic stock decrement, unique indexes, and
 * pre-save hooks are exercised against the actual engine (not mocked).
 *
 * Resolution order:
 *   1. MONGO_TEST_URI  — point at any real Mongo (Atlas, docker, local replset).
 *   2. mongodb-memory-server as a single-node REPLICA SET, so transactions work
 *      (a standalone mongod cannot start a transaction). Downloads a mongod
 *      binary on first use — works anywhere the network allows it (e.g. CI).
 *
 * If neither is reachable, `ready` is false and the caller skips its tests with
 * a clear reason rather than failing — so `npm test` stays green in a sandbox
 * with no database while CI runs the full suite for real.
 */

let replset = null;

const startMemoryReplSet = async () => {
  const { MongoMemoryReplSet } = await import('mongodb-memory-server');
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  return replset.getUri();
};

export const connectTestDb = async () => {
  // Prefer an explicitly provided real database.
  if (process.env.MONGO_TEST_URI) {
    try {
      await mongoose.connect(process.env.MONGO_TEST_URI, { serverSelectionTimeoutMS: 8000 });
      return { ready: true, source: 'MONGO_TEST_URI' };
    } catch (err) {
      return { ready: false, reason: `MONGO_TEST_URI unreachable: ${err.message}` };
    }
  }

  // Otherwise spin up an in-process replica set (needs to download mongod).
  try {
    const uri = await startMemoryReplSet();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    return { ready: true, source: 'mongodb-memory-server (replset)' };
  } catch (err) {
    return {
      ready: false,
      reason: `No test database available (set MONGO_TEST_URI, or allow the mongod binary download): ${err.message}`,
    };
  }
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  if (replset) await replset.stop().catch(() => {});
};

/** Wipe all collections between tests for isolation. */
export const clearCollections = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};
