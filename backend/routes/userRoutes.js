import express from 'express';
import { verifyToken, requireUser } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  syncUserSchema,
  addressSchema,
  updateLocationSchema,
  registerPushTokenSchema,
} from '../validation/schemas.js';
import {
  syncProfile,
  getProfile,
  addAddress,
  updateLocation,
  registerPushToken,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/sync', verifyToken, validate({ body: syncUserSchema }), syncProfile);
router.get('/me', verifyToken, requireUser, getProfile);
router.post('/me/addresses', verifyToken, requireUser, validate({ body: addressSchema }), addAddress);
router.patch('/me/location', verifyToken, requireUser, validate({ body: updateLocationSchema }), updateLocation);
router.post('/push-token', verifyToken, requireUser, validate({ body: registerPushTokenSchema }), registerPushToken);

export default router;
