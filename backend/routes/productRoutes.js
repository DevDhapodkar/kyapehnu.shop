import express from 'express';
import { verifyToken, requireVendor, requireApprovedVendor } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  vendorIdParams,
  productIdParams,
} from '../validation/schemas.js';
import {
  createProduct,
  listByVendor,
  listMyProducts,
  getProduct,
  updateProduct,
} from '../controllers/productController.js';

const router = express.Router();

// Vendor-owned catalog. `requireApprovedVendor` blocks pending/suspended shops.
router.post('/', verifyToken, requireApprovedVendor, validate({ body: createProductSchema }), createProduct);
router.get('/mine', verifyToken, requireVendor, listMyProducts);

// Customer-facing reads.
router.get('/vendor/:vendorId', verifyToken, validate({ params: vendorIdParams }), listByVendor);
router.get('/:id', verifyToken, validate({ params: productIdParams }), getProduct);

router.patch(
  '/:id',
  verifyToken,
  requireApprovedVendor,
  validate({ params: productIdParams, body: updateProductSchema }),
  updateProduct
);

export default router;
