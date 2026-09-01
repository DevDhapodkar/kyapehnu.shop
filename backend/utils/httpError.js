// One place to answer a request that failed for a server-side reason without
// leaking why. Mongoose/driver errors carry schema field names, connection
// details and stack frames; returning error.message to an API caller (as the
// controllers used to) hands those to anyone who can trigger a 500. The detail
// is logged for diagnosis; the client gets only a stable, human message.

/**
 * @param {import('express').Response} res
 * @param {string} message Client-safe message (no internal detail)
 * @param {unknown} error The underlying error, logged but never sent
 * @param {number} [status=500]
 * @returns {import('express').Response}
 */
export const serverError = (res, message, error, status = 500) => {
  console.error(`${message}:`, error?.message || error);
  return res.status(status).json({ message });
};
