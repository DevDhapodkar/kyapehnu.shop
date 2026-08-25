import express from 'express';
import { verifyToken, requireVendor } from '../middleware/authMiddleware.js';
import { syncProfile, getProfile, listNearby, savePushToken } from '../controllers/vendorController.js';

const router = express.Router();

router.post('/sync', verifyToken, syncProfile);
router.get('/me', verifyToken, requireVendor, getProfile);
router.get('/nearby', listNearby);
router.post('/me/push-token', verifyToken, requireVendor, savePushToken);

export default router;
