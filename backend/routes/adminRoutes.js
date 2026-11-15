import express from 'express';

import { requireAdmin } from '../middleware/adminMiddleware.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
import {
  login,
  getSetupStatus,
  setupFirstAdmin,
  getMe,
  listPendingProducts,
  listAllProducts,
  getProductDetails,
  updateProductAsAdmin,
  reviewProduct,
  createProductAsAdmin,
  listVendors,
  getVendorDetails,
  updateVendorAsAdmin,
  reviewVendor,
  createVendorAsAdmin,
  listOrders,
  getOrderDetails,
  getStats,
  systemWipeTestData,
  cleanSlate,
  listUsers,
  getUserDetails,
  updateUserAsAdmin,
  deleteUserAsAdmin,
  deleteVendorAsAdmin,
  deleteProductAsAdmin,
  getAdminConfig,
  updateAdminConfig,
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
router.get('/config', getAdminConfig);
router.patch('/config', updateAdminConfig);

router.get('/users', listUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id', updateUserAsAdmin);
router.delete('/users/:id', deleteUserAsAdmin);

router.get('/products/pending', listPendingProducts);
router.get('/products', listAllProducts);
router.get('/products/:id', getProductDetails);
router.post('/products', createProductAsAdmin);
router.patch('/products/:id', updateProductAsAdmin);
router.delete('/products/:id', deleteProductAsAdmin);
router.patch('/products/:id/review', reviewProduct);

router.get('/vendors', listVendors);
router.get('/vendors/:id', getVendorDetails);
router.post('/vendors', createVendorAsAdmin);
router.patch('/vendors/:id', updateVendorAsAdmin);
router.delete('/vendors/:id', deleteVendorAsAdmin);
router.patch('/vendors/:id/review', reviewVendor);

router.get('/orders', listOrders);
router.get('/orders/:id', getOrderDetails);
router.patch('/orders/:id/status', adminAdvanceOrder);

export default router;
