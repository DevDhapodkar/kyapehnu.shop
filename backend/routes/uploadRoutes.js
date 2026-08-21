import express from 'express';

import { verifyToken, requireVendor } from '../middleware/authMiddleware.js';
import { uploadProductImages, deleteProductImage } from '../controllers/uploadController.js';

const router = express.Router();

// Only an authenticated vendor may add or remove catalog imagery.
router.post('/images', verifyToken, requireVendor, uploadProductImages);
router.delete('/images', verifyToken, requireVendor, deleteProductImage);

export default router;
