import firebaseAuth from '../config/firebase.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import { asyncHandler, unauthorized, notFound, forbidden } from '../lib/errors.js';

/**
 * Verify the Firebase ID token and attach the decoded claims. Every protected
 * route starts here; the `require*` guards below resolve the DB profile.
 */
export const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw unauthorized('No auth token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    req.firebaseUser = await firebaseAuth.verifyIdToken(token);
  } catch {
    throw unauthorized('Invalid or expired token');
  }
  next();
});

export const requireUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
  if (!user) throw notFound('User profile not found');
  req.user = user;
  next();
});

export const requireVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ firebaseUid: req.firebaseUser.uid });
  if (!vendor) throw notFound('Vendor profile not found');
  req.vendor = vendor;
  next();
});

/**
 * A vendor whose onboarding an admin has APPROVED. Gates catalog/order actions
 * so a pending or suspended shop cannot operate.
 */
export const requireApprovedVendor = asyncHandler(async (req, res, next) => {
  const vendor = await Vendor.findOne({ firebaseUid: req.firebaseUser.uid });
  if (!vendor) throw notFound('Vendor profile not found');
  if (vendor.status !== 'APPROVED') {
    throw forbidden(`Your shop is ${vendor.status.toLowerCase().replace('_', ' ')}. Access is limited until an admin approves it.`);
  }
  req.vendor = vendor;
  next();
});

/**
 * Resolve whichever profile (customer and/or vendor) backs this Firebase uid,
 * without failing if one is absent. Used by endpoints readable by either side
 * (e.g. order detail), where the controller then asserts ownership.
 */
export const resolveActor = asyncHandler(async (req, res, next) => {
  const [user, vendor] = await Promise.all([
    User.findOne({ firebaseUid: req.firebaseUser.uid }),
    Vendor.findOne({ firebaseUid: req.firebaseUser.uid }),
  ]);
  if (!user && !vendor) throw notFound('No profile found for this account');
  req.user = user || undefined;
  req.vendor = vendor || undefined;
  next();
});

export default { verifyToken, requireUser, requireVendor, requireApprovedVendor, resolveActor };
