import express from 'express';

import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  login,
  getSetupStatus,
  setupFirstAdmin,
  getMe,
  listPendingProducts,
  reviewProduct,
  createProductAsAdmin,
  listVendors,
  reviewVendor,
  createVendorAsAdmin,
  listOrders,
  getStats,
} from '../controllers/adminController.js';
import { adminAdvanceOrder } from '../controllers/orderController.js';

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
router.post('/products', createProductAsAdmin);
router.patch('/products/:id/review', reviewProduct);

router.get('/vendors', listVendors);
router.post('/vendors', createVendorAsAdmin);
router.patch('/vendors/:id/review', reviewVendor);

router.get('/orders', listOrders);
router.patch('/orders/:id/status', adminAdvanceOrder);

export default router;
