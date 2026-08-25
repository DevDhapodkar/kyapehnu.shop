import express from 'express';

import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  login,
  getSetupStatus,
  setupFirstAdmin,
  getMe,
  listPendingProducts,
  reviewProduct,
  listVendors,
  reviewVendor,
  listOrders,
  getStats,
} from '../controllers/adminController.js';

const router = express.Router();

// Public: first-run setup + obtain an admin session.
router.get('/needs-setup', getSetupStatus);
router.post('/setup', setupFirstAdmin);
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
