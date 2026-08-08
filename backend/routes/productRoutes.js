import express from 'express';
import { verifyToken, requireVendor } from '../middleware/authMiddleware.js';
import { createProduct, listByVendor, getProduct, updateProduct } from '../controllers/productController.js';

const router = express.Router();

router.post('/', verifyToken, requireVendor, createProduct);
router.get('/vendor/:vendorId', listByVendor);
router.get('/:id', getProduct);
router.patch('/:id', verifyToken, requireVendor, updateProduct);

export default router;
