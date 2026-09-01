import Admin from '../models/Admin.js';
import { verifyAdminToken } from '../utils/adminAuth.js';
import { serverError } from '../utils/httpError.js';

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
    return serverError(res, 'Failed to resolve admin', error);
  }
};
