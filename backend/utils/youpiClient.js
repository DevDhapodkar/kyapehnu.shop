import crypto from 'node:crypto';
import axios from 'axios';

/**
 * YOUPI PG V2 — Node.js Merchant Client & Cryptographic Signature Verifier
 * Official integration utility for Kya Pehnu Nagpur marketplace.
 *
 * Provides:
 * 1. createPaymentSession: Communicates with YouPI-PG to initiate UPI / COD payment sessions.
 * 2. getPaymentStatus: Queries payment status and bank observation verification (UTR).
 * 3. verifyWebhookSignature: Verifies HMAC-SHA256 signature from YouPI webhook events.
 * 4. generateUpiUri: Builds standardized NPCI UPI deep-link intent for mobile apps.
 */

const getGatewayConfig = () => {
  const apiUrl = (process.env.YOUPI_API_URL || 'http://localhost:7000').replace(/\/+$/, '');
  const portalUrl = (process.env.YOUPI_PORTAL_URL || apiUrl).replace(/\/+$/, '');
  const merchantId = process.env.YOUPI_MERCHANT_ID || '00000000-0000-0000-0000-000000000001';
  const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET || 'kyapehnu_youpi_webhook_secret_nagpur_2026';
  const vpa = process.env.YOUPI_VPA || 'kyapehnushop@okaxis';
  const merchantName = process.env.YOUPI_MERCHANT_NAME || 'Kya Pehnu? Nagpur';

  return { apiUrl, portalUrl, merchantId, webhookSecret, vpa, merchantName };
};

/**
 * Generates an HMAC-SHA256 signature.
 * @param {string} data Raw string payload
 * @param {string} secret Secret key
 * @returns {string} Hex signature
 */
export const generateHmac = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
};

/**
 * Timing-safe HMAC signature verification.
 * @param {string} rawPayloadString Raw request body text (unparsed)
 * @param {string} signatureHeader Value of 'X-Gateway-Signature' header (e.g. 'sha256=...')
 * @param {string} [customSecret] Optional override secret
 * @returns {boolean} True if signature is cryptographically valid
 */
export const verifyWebhookSignature = (rawPayloadString, signatureHeader, customSecret = null) => {
  const config = getGatewayConfig();
  const secret = customSecret || config.webhookSecret;
  if (!secret) {
    console.warn('[YouPI-PG] Webhook verification failed: No webhook secret configured');
    return false;
  }
  if (!signatureHeader) {
    return false;
  }

  const expectedSignatureHex = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader;

  const actualSignatureHex = generateHmac(rawPayloadString, secret);

  try {
    const actualBuffer = Buffer.from(actualSignatureHex, 'hex');
    const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * Generates standard NPCI UPI payment deep-link URI.
 */
export const generateUpiUri = ({ vpa, name, amount, orderId }) => {
  const config = getGatewayConfig();
  const targetVpa = vpa || config.vpa;
  const targetName = name || config.merchantName;
  const targetAmount = Number(amount || 0).toFixed(2);
  const targetNote = orderId || `Kyapehnu-${Date.now()}`;

  return `upi://pay?pa=${encodeURIComponent(targetVpa)}&pn=${encodeURIComponent(targetName)}&am=${targetAmount}&cu=INR&tn=${encodeURIComponent(targetNote)}`;
};

/**
 * Creates a payment session with YouPI Payment Gateway.
 * If YouPI server is running, invokes its REST endpoint. If unreachable (e.g. dev/test mode),
 * gracefully falls back to generating a valid session with direct UPI URI and mock checkout URL.
 */
export const createPaymentSession = async ({
  orderId,
  amount,
  currency = 'INR',
  customer = {},
  metadata = {},
  returnUrl = '',
  idempotencyKey = '',
}) => {
  const config = getGatewayConfig();
  const numAmount = Number(amount);
  const amountStr = numAmount.toFixed(2);
  const upiUri = generateUpiUri({ vpa: config.vpa, name: config.merchantName, amount: numAmount, orderId });

  const payload = {
    orderId,
    amount: amountStr,
    currency,
    returnUrl: returnUrl || `https://www.kyapehnu.shop/app/tracking/${orderId}`,
    customer: {
      fullName: customer.name || customer.fullName || 'Nagpur Customer',
      phoneNumber: customer.phone || customer.phoneNumber || '9823055443',
    },
    metadata: {
      ...metadata,
      orderId,
      gateway: 'YOUPI_PG',
      platform: 'Kya Pehnu',
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Merchant-Id': config.merchantId,
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  try {
    const res = await axios.post(`${config.apiUrl}/api/v1/payments`, payload, {
      headers,
      timeout: 4000,
    });
    return {
      ...res.data,
      upiUri,
      isSimulated: false,
    };
  } catch (err) {
    // Graceful offline fallback: if YouPI daemon is starting up or in test environment
    const generatedPaymentId = `youpi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      paymentId: generatedPaymentId,
      orderId,
      amount: amountStr,
      amountPaise: Math.round(numAmount * 100),
      currency,
      status: 'PENDING',
      checkoutUrl: `${config.portalUrl}/pay/${generatedPaymentId}`,
      upiUri,
      isSimulated: true,
      note: 'YouPI standalone session ready (0% Fee Direct UPI)',
    };
  }
};

/**
 * Queries payment verification status from YouPI PG.
 */
export const getPaymentStatus = async (paymentId) => {
  const config = getGatewayConfig();
  try {
    const res = await axios.get(`${config.apiUrl}/api/v1/payments/${paymentId}`, {
      headers: {
        'X-Merchant-Key': config.webhookSecret,
      },
      timeout: 4000,
    });
    return res.data;
  } catch (err) {
    return {
      paymentId,
      status: 'PENDING',
      error: err.message,
    };
  }
};

export default {
  getGatewayConfig,
  generateHmac,
  verifyWebhookSignature,
  generateUpiUri,
  createPaymentSession,
  getPaymentStatus,
};
