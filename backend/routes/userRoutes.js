import express from 'express';
import { verifyToken, requireUser } from '../middleware/authMiddleware.js';
import {
  syncProfile,
  getProfile,
  addAddress,
  updateLocation,
  savePushToken,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/sync', verifyToken, syncProfile);
router.get('/me', verifyToken, requireUser, getProfile);
router.post('/me/addresses', verifyToken, requireUser, addAddress);
router.patch('/me/location', verifyToken, requireUser, updateLocation);
router.post('/me/push-token', verifyToken, requireUser, savePushToken);

export default router;
