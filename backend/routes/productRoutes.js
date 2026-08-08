import express from 'express';
import { verifyToken, requireVendor } from '../middleware/authMiddleware.js';
import {
  createProduct,
  listByVendor,
  listMyProducts,
  getProduct,
  updateProduct,
} from '../controllers/productController.js';

const router = express.Router();

router.post('/', verifyToken, requireVendor, createProduct);

// Static segment must be declared before '/:id' or Express matches "mine" as an id.
router.get('/mine', verifyToken, requireVendor, listMyProducts);

router.get('/vendor/:vendorId', listByVendor);
router.get('/:id', getProduct);
router.patch('/:id', verifyToken, requireVendor, updateProduct);

export default router;
