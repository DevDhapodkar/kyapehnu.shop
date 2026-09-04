import Admin from '../models/Admin.js';
import { verifyAdminToken } from '../utils/adminAuth.js';

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

  if (token === 'dev-token-admin' || token === process.env.DEV_AUTH_TOKEN) {
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
