// Rate limiters for the endpoints an unauthenticated caller can hammer.
//
// Two profiles: `authLimiter` for credential-guessing surfaces (admin
// login/setup, guest order tracking — where phone + order id is effectively a
// password), and `orderLimiter` for the public guest-checkout write path so it
// cannot be used to flood the shop with fake orders. Keyed by client IP with
// the library's in-memory store — fine for a single instance; a multi-instance
// deploy would point `store` at Redis.

import rateLimit from 'express-rate-limit';

const MINUTE = 60 * 1000;

/**
 * Build limiter options. Kept as a plain factory so the numbers are testable
 * without standing up the middleware.
 * @param {{ windowMs: number, max: number, message: string }} cfg
 */
export const limiterOptions = ({ windowMs, max, message }) => ({
  windowMs,
  max,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false, // no X-RateLimit-*
  message: { message },
});

// Tight: brute-force protection. 10 attempts per IP per 15 minutes.
export const AUTH_LIMIT = { windowMs: 15 * MINUTE, max: 10, message: 'Too many attempts, try again later' };

// Moderate: a real shopper places a handful of orders, not dozens a minute.
export const ORDER_LIMIT = { windowMs: MINUTE, max: 20, message: 'Too many orders from this device, slow down' };

export const authLimiter = rateLimit(limiterOptions(AUTH_LIMIT));
export const orderLimiter = rateLimit(limiterOptions(ORDER_LIMIT));
