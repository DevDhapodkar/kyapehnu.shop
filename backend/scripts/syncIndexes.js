import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Admin from '../models/Admin.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';

dotenv.config();

// One-shot index reconciliation. `syncIndexes()` creates every index declared
// on the schema AND drops any index on the collection that the schema no longer
// declares — which plain `autoIndex` never does. Run this after changing an
// index definition, and on every production deploy (autoIndex is off in prod):
//   npm run sync-indexes
const MODELS = { Admin, Order, Product, User, Vendor };

// Preflight: a unique index build throws E11000 halfway through if the
// collection already holds duplicate non-null values, which fails a deploy with
// a cryptic error. Scan first and abort with the exact offending values so the
// operator can dedupe before re-running. Add a { model, field } row here for
// every unique index that could pre-exist duplicate data.
const UNIQUE_PREFLIGHT = [{ Model: Product, name: 'Product', field: 'sku' }];

const findDuplicates = async ({ Model, field }) => {
  const groups = await Model.collection
    .aggregate([
      { $match: { [field]: { $ne: null } } },
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  return groups;
};

const preflightUniqueness = async () => {
  let clean = true;
  for (const spec of UNIQUE_PREFLIGHT) {
    const dupes = await findDuplicates(spec);
    if (dupes.length) {
      clean = false;
      console.error(
        `ABORT: ${spec.name}.${spec.field} has ${dupes.length} duplicate value(s); ` +
          `the UNIQUE index build would throw E11000. Dedupe these first:`
      );
      dupes.forEach((d) => console.error(`  ${spec.field}=${d._id} x${d.count}`));
    }
  }
  return clean;
};

const run = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

    if (!(await preflightUniqueness())) {
      await mongoose.connection.close();
      process.exit(1);
    }

    for (const [name, Model] of Object.entries(MODELS)) {
      const dropped = await Model.syncIndexes();
      const indexes = await Model.collection.indexes();
      const keys = indexes.map((i) => i.name).join(', ');
      console.log(`${name}: synced (dropped stale: ${JSON.stringify(dropped)})`);
      console.log(`  indexes -> ${keys}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(`Index sync failed: ${err.message}`);
    process.exit(1);
  }
};

run();
