import express from 'express';
import { verifyToken, requireUser, requireVendor } from '../middleware/authMiddleware.js';
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
} from '../controllers/orderController.js';

const router = express.Router();

// Public web storefront: guest COD checkout + order tracking (no account).
router.post('/guest', createGuestOrder);
router.get('/track', trackGuestOrder);

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
