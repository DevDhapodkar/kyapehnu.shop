import express from 'express';
import { verifyToken, requireUser } from '../middleware/authMiddleware.js';
import {
  syncProfile,
  getProfile,
  addAddress,
  deleteAddress,
  updateLocation,
  savePushToken,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/sync', verifyToken, syncProfile);
router.get('/me', verifyToken, requireUser, getProfile);
router.post('/me/addresses', verifyToken, requireUser, addAddress);
router.delete('/me/addresses/:addressId', verifyToken, requireUser, deleteAddress);
router.patch('/me/location', verifyToken, requireUser, updateLocation);
router.post('/me/push-token', verifyToken, requireUser, savePushToken);

export default router;
