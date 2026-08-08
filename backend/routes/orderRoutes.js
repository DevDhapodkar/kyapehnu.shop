import express from 'express';
import { verifyToken, requireUser, requireVendor } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getOrderById,
  listVendorOrders,
  markOrderReady,
  updateOrderStatus,
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', verifyToken, requireUser, createOrder);

// Static segment must be declared before '/:id' or Express matches "vendor" as an id.
router.get('/vendor/mine', verifyToken, requireVendor, listVendorOrders);

router.get('/:id', verifyToken, getOrderById);
router.patch('/:id/status', verifyToken, requireVendor, updateOrderStatus);

// Dispatches a Porter driver and a WhatsApp confirmation in parallel.
router.post('/:orderId/ready', verifyToken, requireVendor, markOrderReady);

export default router;
