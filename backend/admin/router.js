import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import * as C from './controllers.js';

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
router.post('/products/:id/approve', C.approveProduct);
router.post('/products/:id/reject', C.rejectProduct);

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
