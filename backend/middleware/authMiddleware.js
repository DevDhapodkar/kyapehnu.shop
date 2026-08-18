import firebaseAuth from '../config/firebase.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No auth token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};

const requireUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) return res.status(404).json({ message: 'User profile not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve user', error: error.message });
  }
};

const requireVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });
    req.vendor = vendor;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve vendor', error: error.message });
  }
};

/**
 * Admin gate for the vendor-review panel. An account is an admin if either:
 *   - its Firebase token carries a custom claim `admin: true`
 *     (set with `firebase-admin` — see scripts/setAdmin.js), or
 *   - its email is listed in the ADMIN_EMAILS env var (comma-separated),
 *     the quickest way to bootstrap the very first admin.
 *
 * Runs after `verifyToken`, so `req.firebaseUser` is the verified token.
 */
const adminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const requireAdmin = (req, res, next) => {
  const { admin, email } = req.firebaseUser || {};
  const isAdmin = admin === true || (email && adminEmails().includes(email.toLowerCase()));

  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export { verifyToken, requireUser, requireVendor, requireAdmin };
