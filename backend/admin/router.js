import express from 'express';
import multer from 'multer';
import { adminAuth } from '../middleware/adminAuth.js';
import * as C from './controllers.js';

// In-memory upload for admin product photos: small, forwarded straight to
// Cloudinary, never written to disk. 5 MB cap, images only.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

/**
 * Server-rendered admin portal. Deliberately not a separate SPA build — it is a
 * small internal back-office, so it ships as HTML from Express with form posts
 * and a JWT session cookie. Mounted at /admin.
 *
 * A stricter rate limiter is applied to the login route by the caller.
 */
const router = express.Router();

// Public auth routes.
router.get('/login', C.showLogin);
router.post('/login', C.doLogin);
router.get('/logout', C.doLogout);

// Everything below requires an admin session.
router.use(adminAuth);

router.get('/', C.dashboard);

router.get('/products', C.listProducts);
router.get('/products/:id', C.productDetail);
router.post('/products/:id/approve', C.approveProduct);
router.post('/products/:id/reject', C.rejectProduct);
router.post('/products/:id/image', upload.single('image'), C.uploadProductImage);
router.post('/products/:id/image/remove', C.removeProductImage);

router.get('/vendors', C.listVendors);
router.post('/vendors/:id/approve', C.approveVendor);
router.post('/vendors/:id/reject', C.rejectVendor);

router.get('/orders', C.listOrders);
router.get('/orders/:id', C.orderDetail);
router.get('/orders/:id/invoice', C.viewInvoice);
router.post('/orders/:id/cancel', C.cancelOrder);

router.get('/settings', C.showSettings);
router.post('/settings', C.saveSettings);

export default router;
