import { verifyIdToken, isFirebaseConfigured } from '../config/firebase.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';

// Dev-token auth (`Bearer dev-token-<uid>` impersonates any user with no
// verification) is a hard auth bypass. It is fail-secure: OFF unless the server
// is explicitly non-production AND opted in via ALLOW_DEV_TOKEN=true. With no
// env set — as on any production/Render deploy — this path is disabled, so a
// dev token is rejected and falls through to real Firebase verification.
const isDevAuthEnabled = () =>
  process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_TOKEN === 'true';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No auth token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (
    isDevAuthEnabled() &&
    (token.startsWith('dev-token-') || (process.env.DEV_AUTH_TOKEN && token === process.env.DEV_AUTH_TOKEN))
  ) {
    const uid = token.startsWith('dev-token-') ? token.replace('dev-token-', '') : 'dev-user-123';
    req.firebaseUser = {
      uid,
      email: `${uid}@kyapehnu.local`,
      name: 'Developer Test',
    };
    return next();
  }

  if (!isFirebaseConfigured) {
    return res.status(503).json({ message: 'Authentication is not configured on this server' });
  }

  try {
    req.firebaseUser = await verifyIdToken(token);
    next();
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({
      message: status === 503 ? error.message : 'Invalid or expired token',
      error: error.message,
    });
  }
};

const requireUser = async (req, res, next) => {
  try {
    const email = req.firebaseUser.email?.toLowerCase();
    const user = await User.findOne({
      $or: [
        { firebaseUid: req.firebaseUser.uid },
        ...(email ? [{ email }] : []),
      ],
    });
    if (!user) return res.status(404).json({ message: 'User profile not found' });
    if (user.firebaseUid !== req.firebaseUser.uid) {
      user.firebaseUid = req.firebaseUser.uid;
      await user.save();
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve user', error: error.message });
  }
};

const requireVendor = async (req, res, next) => {
  try {
    const email = req.firebaseUser.email?.toLowerCase();
    const vendor = await Vendor.findOne({
      $or: [
        { firebaseUid: req.firebaseUser.uid },
        ...(email ? [{ email }] : []),
      ],
    });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    if (vendor.firebaseUid !== req.firebaseUser.uid) {
      vendor.firebaseUid = req.firebaseUser.uid;
      await vendor.save();
    }
    req.vendor = vendor;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve vendor', error: error.message });
  }
};

export { verifyToken, requireUser, requireVendor };
