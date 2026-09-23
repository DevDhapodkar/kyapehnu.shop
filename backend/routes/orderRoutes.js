import express from 'express';
import { verifyToken, requireUser, requireVendor } from '../middleware/authMiddleware.js';
import {
  guestCheckoutLimiter,
  guestTrackingLimiter,
} from '../middleware/securityMiddleware.js';
import {
  createOrder,
  createGuestOrder,
  trackGuestOrder,
  getOrderById,
  listMyOrders,
  listVendorOrders,
  markOrderReady,
  updateOrderStatus,
  cancelOrder,
  checkOrderServiceability,
} from '../controllers/orderController.js';

const router = express.Router();

// Public delivery serviceability pre-validation check (Nagpur bounds)
router.post('/check-serviceability', checkOrderServiceability);

// Public web storefront: guest COD checkout + order tracking (rate-limited).
router.post('/guest', guestCheckoutLimiter, createGuestOrder);
router.get('/track', guestTrackingLimiter, trackGuestOrder);

router.post('/', verifyToken, requireUser, createOrder);

// Static segments before '/:id' so Express doesn't match them as an id.
router.get('/mine', verifyToken, requireUser, listMyOrders);
router.get('/vendor/mine', verifyToken, requireVendor, listVendorOrders);

router.get('/:id', verifyToken, getOrderById);
router.patch('/:id/cancel', verifyToken, requireUser, cancelOrder);
router.patch('/:id/status', verifyToken, requireVendor, updateOrderStatus);

// Dispatches a Porter driver and a WhatsApp confirmation in parallel.
router.post('/:orderId/ready', verifyToken, requireVendor, markOrderReady);

export default router;
