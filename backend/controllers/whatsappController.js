import crypto from 'node:crypto';
import { loadEnv } from '../config/env.js';
import { log } from '../lib/logger.js';

const env = loadEnv();

/**
 * GET webhook — Meta subscription handshake. Unchanged: echoes the challenge
 * when the verify token matches.
 */
export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === env.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

/**
 * Verify Meta's `X-Hub-Signature-256` HMAC over the RAW request body. Closes the
 * "anyone who finds the URL can POST forged events" gap. Requires the raw body
 * to be captured by the json parser's `verify` hook (see server.js). Uses a
 * timing-safe comparison.
 */
const isValidSignature = (req) => {
  const secret = env.whatsapp.appSecret;
  if (!secret) return false; // no secret configured ⇒ reject, don't trust blindly
  const header = req.get('X-Hub-Signature-256') || '';
  const raw = req.rawBody;
  if (!raw || !header.startsWith('sha256=')) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * POST webhook — inbound WhatsApp events. Rejects anything without a valid
 * signature. Body is NOT logged verbatim (it carries phone numbers); only a
 * redacted summary is recorded.
 */
export const handleIncomingWebhook = (req, res) => {
  if (!isValidSignature(req)) {
    log.warn('Rejected WhatsApp webhook with invalid/missing signature');
    return res.sendStatus(401);
  }
  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return res.sendStatus(404);

  // Acknowledge fast; real inventory-command parsing is a future enhancement and
  // will run behind this now-authenticated boundary.
  const changes = body.entry?.flatMap((e) => e.changes || []) || [];
  log.info('WhatsApp webhook received', { changeCount: changes.length });
  res.sendStatus(200);
};

export default { verifyWebhook, handleIncomingWebhook };
