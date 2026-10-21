import {
  createYoupiSession,
  checkYoupiPaymentStatus,
  verifyYoupiPayment,
} from '../api/vendorApi';

/**
 * YouPI-PG Client Integration Service
 * Sovereign direct-to-bank UPI payment gateway (0% fees, instant bank settlement).
 */

/**
 * Formats seconds into MM:SS display.
 */
export const formatUpiExpiry = (seconds) => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Generates app-specific UPI intent links from standard NPCI UPI URI.
 */
export const getUpiAppLinks = (upiUri) => {
  if (!upiUri) return {};
  const uriWithoutScheme = upiUri.replace(/^upi:\/\//, '');

  return {
    upi: upiUri,
    gpay: `gpay://upi/${uriWithoutScheme}`,
    phonepe: `phonepe://upi/${uriWithoutScheme}`,
    paytm: `paytmmp://upi/${uriWithoutScheme}`,
    cred: `cred://upi/${uriWithoutScheme}`,
    bhim: `bhim://upi/${uriWithoutScheme}`,
  };
};

/**
 * Initiates a YouPI UPI payment session.
 */
export const initiatePaymentSession = async ({
  orderId,
  amount,
  customer = {},
  metadata = {},
  returnUrl = '',
}) => {
  return await createYoupiSession({
    orderId,
    amount,
    customer,
    metadata,
    returnUrl,
  });
};

/**
 * Checks payment observation status.
 */
export const queryPaymentStatus = async (paymentId) => {
  return await checkYoupiPaymentStatus(paymentId);
};

/**
 * Confirms payment with UTR.
 */
export const confirmPaymentUtr = async ({ orderId, paymentId, utr }) => {
  return await verifyYoupiPayment({
    orderId,
    paymentId,
    utr,
  });
};

export default {
  formatUpiExpiry,
  getUpiAppLinks,
  initiatePaymentSession,
  queryPaymentStatus,
  confirmPaymentUtr,
};
