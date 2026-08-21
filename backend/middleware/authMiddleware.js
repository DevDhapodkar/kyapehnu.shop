import { verifyIdToken, isFirebaseConfigured } from '../config/firebase.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No auth token provided' });
  }

  if (!isFirebaseConfigured) {
    return res.status(503).json({ message: 'Authentication is not configured on this server' });
  }

  const token = authHeader.split(' ')[1];

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

export { verifyToken, requireUser, requireVendor };
