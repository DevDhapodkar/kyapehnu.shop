import express from 'express';

import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import {
  listApplications,
  getApplication,
  updateApplication,
  approveApplication,
  rejectApplication,
  listVendors,
  updateVendor,
} from '../controllers/adminController.js';

const router = express.Router();

// Every admin route is gated by a verified token AND admin authority.
router.use(verifyToken, requireAdmin);

// Vendor applications — the review queue.
router.get('/vendor-applications', listApplications);
router.get('/vendor-applications/:id', getApplication);
router.patch('/vendor-applications/:id', updateApplication);
router.post('/vendor-applications/:id/approve', approveApplication);
router.post('/vendor-applications/:id/reject', rejectApplication);

// Live vendors — edit anything on an approved shop.
router.get('/vendors', listVendors);
router.patch('/vendors/:id', updateVendor);

// Lets the panel confirm the signed-in account really is an admin.
router.get('/me', (req, res) => res.json({ email: req.firebaseUser.email, admin: true }));

export default router;
