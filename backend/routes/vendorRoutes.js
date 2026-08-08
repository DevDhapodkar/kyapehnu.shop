import express from 'express';
import { verifyToken, requireVendor } from '../middleware/authMiddleware.js';
import { syncProfile, getProfile, listNearby } from '../controllers/vendorController.js';

const router = express.Router();

router.post('/sync', verifyToken, syncProfile);
router.get('/me', verifyToken, requireVendor, getProfile);
router.get('/nearby', listNearby);

export default router;
