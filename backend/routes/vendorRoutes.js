import express from 'express';
import { verifyToken, requireVendor } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { syncVendorSchema, nearbyQuerySchema, registerPushTokenSchema } from '../validation/schemas.js';
import { syncProfile, getProfile, listNearby, registerPushToken } from '../controllers/vendorController.js';

const router = express.Router();

router.post('/sync', verifyToken, validate({ body: syncVendorSchema }), syncProfile);
router.get('/me', verifyToken, requireVendor, getProfile);
router.get('/nearby', verifyToken, validate({ query: nearbyQuerySchema }), listNearby);
router.post('/push-token', verifyToken, requireVendor, validate({ body: registerPushTokenSchema }), registerPushToken);

export default router;
