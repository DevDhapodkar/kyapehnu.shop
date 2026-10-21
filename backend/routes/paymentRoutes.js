import express from 'express';
import {
  createSession,
  checkStatus,
  handleWebhook,
  verifyPayment,
} from '../controllers/paymentController.js';
import { guestCheckoutLimiter } from '../middleware/securityMiddleware.js';

const router = express.Router();

/**
 * YouPI-PG Gateway Routes
 */

// 1. Create a payment session (returns checkoutUrl + dynamic UPI URI)
router.post('/youpi/create-session', guestCheckoutLimiter, createSession);

// 2. Poll real-time payment observation status by paymentId
router.get('/youpi/:paymentId/status', checkStatus);

// 3. Authoritative webhook receiver for YouPI banking observation mesh (HMAC-SHA256 verified)
router.post('/youpi/webhook', handleWebhook);

// 4. Verify payment with order confirmation
router.post('/youpi/verify', verifyPayment);

export default router;
