import express from 'express';
import { verifyToken, requireUser, requireVendor, resolveActor } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  listVendorOrdersQuery,
  orderIdParams,
  orderIdParamAlt,
} from '../validation/schemas.js';
import {
  createOrder,
  getOrderById,
  listMyOrders,
  listVendorOrders,
  updateOrderStatus,
  markOrderReady,
  cancelOrder,
  getOrderInvoice,
} from '../controllers/orderController.js';

const router = express.Router();

// Customer.
router.post('/', verifyToken, requireUser, validate({ body: createOrderSchema }), createOrder);
router.get('/mine', verifyToken, requireUser, listMyOrders);

// Vendor dashboard feed (must precede the /:id route).
router.get('/vendor/mine', verifyToken, requireVendor, validate({ query: listVendorOrdersQuery }), listVendorOrders);

// Order detail + invoice — readable by the owning customer OR vendor only.
router.get('/:id', verifyToken, resolveActor, validate({ params: orderIdParams }), getOrderById);
router.get('/:id/invoice', verifyToken, resolveActor, validate({ params: orderIdParams }), getOrderInvoice);

// Customer cancel (only while PENDING, enforced by the state machine).
router.post('/:id/cancel', verifyToken, requireUser, validate({ params: orderIdParams, body: cancelOrderSchema }), cancelOrder);

// Vendor transitions.
router.patch('/:id/status', verifyToken, requireVendor, validate({ params: orderIdParams, body: updateOrderStatusSchema }), updateOrderStatus);
router.post('/:orderId/ready', verifyToken, requireVendor, validate({ params: orderIdParamAlt }), markOrderReady);

export default router;
