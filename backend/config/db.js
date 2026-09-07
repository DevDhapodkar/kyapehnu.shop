import mongoose from 'mongoose';

// Reject queries that reference paths not in the schema instead of silently
// dropping them — catches typo'd filters that would otherwise scan everything.
mongoose.set('strictQuery', true);

// Building indexes on every boot is fine in dev but a foot-gun against a large
// production collection; there we build them once via `npm run sync-indexes`.
const AUTO_INDEX = process.env.NODE_ENV !== 'production';

const CONNECT_OPTIONS = {
  // Pool sizing. A single Fly.io machine serving the app + admin panel does not
  // need hundreds of sockets; 10 is plenty and bounds Mongo-side connections.
  maxPoolSize: Number(process.env.MONGO_MAX_POOL) || 10,
  minPoolSize: Number(process.env.MONGO_MIN_POOL) || 1,
  // Fail fast when the cluster is unreachable instead of hanging the request.
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT) || 5000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
  autoIndex: AUTO_INDEX,
};

const registerConnectionEvents = () => {
  const { connection } = mongoose;
  connection.on('error', (err) => console.error(`MongoDB error: ${err.message}`));
  connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  connection.on('reconnected', () => console.log('MongoDB reconnected'));
};

// Close the pool cleanly so in-flight writes flush before the process dies.
const registerGracefulShutdown = () => {
  const close = async (signal) => {
    try {
      await mongoose.connection.close();
      console.log(`MongoDB connection closed on ${signal}`);
    } catch (err) {
      console.error(`Error closing MongoDB on ${signal}: ${err.message}`);
    } finally {
      process.exit(0);
    }
  };
  process.once('SIGINT', () => close('SIGINT'));
  process.once('SIGTERM', () => close('SIGTERM'));
};

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';
    registerConnectionEvents();
    const conn = await mongoose.connect(mongoUri, CONNECT_OPTIONS);
    registerGracefulShutdown();
    console.log(`MongoDB connected: ${conn.connection.host} (autoIndex=${AUTO_INDEX})`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
