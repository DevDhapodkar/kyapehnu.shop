/**
 * Tiny structured logger with PII/secret redaction. Emits one JSON line per
 * event to stdout/stderr — greppable, and safe to ship to an aggregator because
 * phone numbers, addresses, tokens, and auth headers are masked before they
 * ever leave the process.
 *
 * Deliberately dependency-free: no pino/winston, no transports to configure.
 * Swap for pino later without changing call sites (`log.info/warn/error`).
 */

const REDACT_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'authorization',
  'auth',
  'privatekey',
  'private_key',
  'apikey',
  'api_key',
  'x-api-key',
  'secret',
  'phone',
  'whatsappnumber',
  'phonenumber',
  'otp',
  'pincode',
  'line1',
  'line2',
  'coordinates',
]);

const MASK = '[redacted]';

const redact = (value, depth = 0) => {
  if (value == null || depth > 6) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase()) ? MASK : redact(v, depth + 1);
    }
    return out;
  }
  return value;
};

const emit = (level, msg, meta) => {
  const line = {
    level,
    time: new Date().toISOString(),
    msg,
    ...(meta ? { meta: redact(meta) } : {}),
  };
  const text = JSON.stringify(line);
  if (level === 'error') process.stderr.write(text + '\n');
  else process.stdout.write(text + '\n');
};

export const log = {
  info: (msg, meta) => emit('info', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', msg, meta);
  },
};

export default log;
