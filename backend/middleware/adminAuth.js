import jwt from 'jsonwebtoken';
import { loadEnv } from '../config/env.js';
import Admin from '../models/Admin.js';

const env = loadEnv();

/** Sign a short-lived session token for an admin, stored in an httpOnly cookie. */
export const signAdminToken = (admin) =>
  jwt.sign({ sub: admin._id.toString(), role: admin.role }, env.admin.jwtSecret, {
    expiresIn: `${env.admin.sessionHours}h`,
  });

export const adminCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  maxAge: env.admin.sessionHours * 60 * 60 * 1000,
  path: '/',
});

/**
 * Gate for every admin portal route. Verifies the session cookie and loads the
 * admin. On failure, HTML requests are redirected to the login page and API
 * requests get a 401 JSON.
 */
export const adminAuth = async (req, res, next) => {
  const token = req.cookies?.[env.admin.cookieName];
  const fail = () => {
    if (req.accepts(['html', 'json']) === 'html') return res.redirect('/admin/login');
    return res.status(401).json({ message: 'Admin authentication required' });
  };
  if (!token) return fail();
  try {
    const payload = jwt.verify(token, env.admin.jwtSecret);
    const admin = await Admin.findById(payload.sub);
    if (!admin || !admin.isActive) return fail();
    req.admin = admin;
    next();
  } catch {
    return fail();
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    return res.status(403).send('Forbidden: super-admin only');
  }
  next();
};

export default { adminAuth, signAdminToken, adminCookieOptions, requireSuperAdmin };
