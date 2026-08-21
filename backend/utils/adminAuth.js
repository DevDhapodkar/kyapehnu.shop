import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Admin sessions are plain JWTs signed with ADMIN_JWT_SECRET (a separate trust
// domain from customer/vendor Firebase auth). 7-day expiry.
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const BCRYPT_ROUNDS = 10;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

/**
 * Read the admin JWT secret, failing loudly (503) rather than signing tokens
 * with an undefined/empty secret.
 * @returns {string}
 */
export const getAdminJwtSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    const err = new Error('ADMIN_JWT_SECRET is not configured on this server');
    err.status = 503;
    throw err;
  }
  return secret;
};

/**
 * @param {{ _id: unknown, email: string, role: string }} admin
 * @returns {string}
 */
export const signAdminToken = (admin) =>
  jwt.sign(
    { sub: String(admin._id), email: admin.email, role: admin.role },
    getAdminJwtSecret(),
    { expiresIn: TOKEN_TTL_SECONDS }
  );

/**
 * @param {string} token
 * @returns {{ sub: string, email: string, role: string }}
 */
export const verifyAdminToken = (token) => jwt.verify(token, getAdminJwtSecret());
