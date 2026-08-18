import mongoose from 'mongoose';
import { log } from '../lib/logger.js';

/**
 * Connect to MongoDB. Accepts the URI explicitly (from validated env) rather
 * than reaching into process.env, so the caller controls configuration.
 */
const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    const conn = await mongoose.connect(uri);
    log.info('MongoDB connected', { host: conn.connection.host });
    return conn;
  } catch (error) {
    log.error('MongoDB connection error', { error: error.message });
    process.exit(1);
  }
};

export default connectDB;
