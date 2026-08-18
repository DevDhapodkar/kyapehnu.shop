import mongoose from 'mongoose';
import { log } from './logger.js';

/**
 * Run `work(session)` inside a MongoDB transaction when the deployment supports
 * it (replica set / Atlas), and fall back to a plain session-less run on a
 * standalone Mongo (local dev), which cannot start transactions.
 *
 * Production (Atlas) is a replica set, so order creation gets true atomicity of
 * "decrement stock + create order + issue invoice". Local single-node dev still
 * works — just without the all-or-nothing guarantee — instead of hard-failing.
 */
const TXN_UNSUPPORTED = new Set([20]); // "Transaction numbers are only allowed on a replica set member or mongos"

export const runInTransaction = async (work) => {
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (err) {
    const unsupported =
      TXN_UNSUPPORTED.has(err.code) ||
      /Transaction numbers are only allowed|replica set|mongos/i.test(err.message || '');
    if (unsupported) {
      log.warn('Transactions unsupported on this Mongo deployment; running without a transaction', {
        error: err.message,
      });
      return work(null);
    }
    throw err;
  } finally {
    if (session) await session.endSession();
  }
};

export default runInTransaction;
