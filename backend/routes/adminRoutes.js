import express from 'express';

import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  login,
  getMe,
  listPendingProducts,
  reviewProduct,
  listVendors,
  reviewVendor,
  listOrders,
  getStats,
} from '../controllers/adminController.js';

const router = express.Router();

// Public: obtain an admin session.
router.post('/login', login);

// Everything below requires a valid admin JWT.
router.use(requireAdmin);

router.get('/me', getMe);
router.get('/stats', getStats);

router.get('/products/pending', listPendingProducts);
router.patch('/products/:id/review', reviewProduct);

router.get('/vendors', listVendors);
router.patch('/vendors/:id/review', reviewVendor);

router.get('/orders', listOrders);

export default router;
