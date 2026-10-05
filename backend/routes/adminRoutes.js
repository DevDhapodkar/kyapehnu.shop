import express from 'express';

import { requireAdmin } from '../middleware/adminMiddleware.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
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
  systemWipeTestData,
  cleanSlate,
  listUsers,
  deleteVendorAsAdmin,
  deleteProductAsAdmin,
} from '../controllers/adminController.js';
import { adminAdvanceOrder } from '../controllers/orderController.js';

const router = express.Router();

// Public: first-run setup + obtain an admin session (brute-force protected).
router.get('/needs-setup', getSetupStatus);
router.post('/setup', authLimiter, setupFirstAdmin);
router.post('/login', authLimiter, login);

// Everything below requires a valid admin JWT.
router.use(requireAdmin);

// Privileged diagnostic wipe — strictly gated behind requireAdmin + SUPER_ADMIN
router.post('/system-wipe-test-data', systemWipeTestData);
router.post('/clean-slate', cleanSlate);

router.get('/me', getMe);
router.get('/stats', getStats);
router.get('/users', listUsers);

router.get('/products/pending', listPendingProducts);
router.post('/products', createProductAsAdmin);
router.delete('/products/:id', deleteProductAsAdmin);
router.patch('/products/:id/review', reviewProduct);

router.get('/vendors', listVendors);
router.post('/vendors', createVendorAsAdmin);
router.delete('/vendors/:id', deleteVendorAsAdmin);
router.patch('/vendors/:id/review', reviewVendor);

router.get('/orders', listOrders);
router.patch('/orders/:id/status', adminAdvanceOrder);

export default router;
