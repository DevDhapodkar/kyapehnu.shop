import Admin from '../models/Admin.js';
import { verifyAdminToken } from '../utils/adminAuth.js';

// Dev-token admin bypass (`Bearer dev-token-admin`) grants SUPER_ADMIN with no
// verification — a hard auth bypass. Fail-secure, matching authMiddleware: OFF
// unless the server is explicitly non-production AND opted in via
// ALLOW_DEV_TOKEN=true. On any production/Render deploy (neither env set) this
// path is disabled, the token is rejected, and control falls through to real
// admin-JWT verification.
const isDevAuthEnabled = () =>
  process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_TOKEN === 'true';

/**
 * Gate a route behind a valid admin JWT and load the admin document onto
 * req.admin. Separate trust domain from the Firebase-based customer/vendor auth.
 */
export const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No admin token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (
    isDevAuthEnabled() &&
    (token === 'dev-token-admin' ||
      (process.env.DEV_AUTH_TOKEN && token === process.env.DEV_AUTH_TOKEN))
  ) {
    let admin = await Admin.findOne({ role: 'SUPER_ADMIN' });
    if (!admin) {
      admin = await Admin.create({
        name: 'Dev Super Admin',
        email: 'admin@kyapehnu.com',
        role: 'SUPER_ADMIN',
        passwordHash: 'dummydevhash'
      });
    }
    req.admin = admin;
    return next();
  }

  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({
      message: status === 503 ? error.message : 'Invalid or expired admin token',
    });
  }

  try {
    const admin = await Admin.findById(payload.sub);
    if (!admin) return res.status(401).json({ message: 'Admin account not found' });
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve admin', error: error.message });
  }
};
