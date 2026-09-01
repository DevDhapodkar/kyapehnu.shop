// CORS origin policy. `app.use(cors())` reflected every origin, so any website
// could drive the API from a visitor's browser with their cookies/None-auth.
//
// The rule: requests with no Origin header (native app, curl, server-to-server,
// and the same-origin admin panel Express serves itself) are always allowed —
// CORS only governs cross-origin *browser* requests. A request that does carry
// an Origin is allowed only when that origin is on the configured allowlist
// (CORS_ALLOWED_ORIGINS, comma-separated). Unknown origins are denied by
// omitting the CORS headers, not by throwing — the browser blocks the read and
// the server stays quiet.

/**
 * @param {string[]} allowedOrigins Exact origins permitted for cross-origin use
 * @returns {{ origin: (origin: string|undefined, cb: Function) => void }}
 */
export const buildCorsOptions = (allowedOrigins = []) => {
  const allowlist = new Set(allowedOrigins.filter(Boolean));
  return {
    origin(origin, callback) {
      // No Origin → not a cross-origin browser request; let it through.
      if (!origin) return callback(null, true);
      return callback(null, allowlist.has(origin));
    },
  };
};

/**
 * Parse CORS_ALLOWED_ORIGINS ("https://a.com, https://b.com") into a clean list.
 * @param {string|undefined} raw
 * @returns {string[]}
 */
export const parseAllowedOrigins = (raw) =>
  (raw || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
