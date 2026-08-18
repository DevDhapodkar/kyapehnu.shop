import express from 'express';
import { verifyToken, requireApprovedVendor } from '../middleware/authMiddleware.js';
import { productImageSignature } from '../controllers/uploadController.js';

const router = express.Router();

// Only an approved vendor may request an upload signature.
router.post('/product-image-signature', verifyToken, requireApprovedVendor, productImageSignature);

export default router;
