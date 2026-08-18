import Product from '../models/Product.js';
import { asyncHandler, notFound } from '../lib/errors.js';
import { rupeesToPaise } from '../lib/money.js';

/**
 * POST /api/products — vendor creates a listing. It lands in PENDING_APPROVAL
 * with margin 0; a customer cannot see or buy it until an admin approves it and
 * sets Kya Pehnu's margin. `vendor` is taken from the token, never the body.
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { basePriceRupees, ...rest } = req.body;
  const product = await Product.create({
    ...rest,
    vendor: req.vendor._id,
    basePricePaise: rupeesToPaise(basePriceRupees),
    marginPaise: 0,
    status: 'PENDING_APPROVAL',
  });
  res.status(201).json(product);
});

/**
 * GET /api/products/vendor/:vendorId — customer-facing storefront for a shop.
 * Only APPROVED + in-stock listings.
 */
export const listByVendor = asyncHandler(async (req, res) => {
  const products = await Product.find({
    vendor: req.params.vendorId,
    status: 'APPROVED',
    isAvailable: true,
  }).limit(200);
  res.json(products);
});

/** GET /api/products/mine — vendor catalog, every status incl. out-of-stock. */
export const listMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ vendor: req.vendor._id }).sort({ updatedAt: -1 });
  res.json(products);
});

/** GET /api/products/:id — a single approved product for the PDP. */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'vendor',
    'shopName address location status'
  );
  if (!product) throw notFound('Product not found');
  res.json(product);
});

/**
 * PATCH /api/products/:id — vendor edits their own listing. Only whitelisted
 * fields (validated upstream) are applied; `vendor`, `status`, and `marginPaise`
 * can never be set from the body, closing the ownership-transfer mass-assignment
 * hole. Changing the base price sends the item back through approval so an admin
 * re-checks the margin.
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, vendor: req.vendor._id });
  if (!product) throw notFound('Product not found for this shop');

  const { basePriceRupees, ...rest } = req.body;
  Object.assign(product, rest);

  if (basePriceRupees !== undefined) {
    const newBase = rupeesToPaise(basePriceRupees);
    if (newBase !== product.basePricePaise) {
      product.basePricePaise = newBase;
      // Price changed → re-moderate so the margin/selling price is re-approved.
      product.status = 'PENDING_APPROVAL';
      product.marginPaise = 0;
    }
  }

  await product.save(); // pre-save keeps sellingPricePaise = base + margin
  res.json(product);
});

export default { createProduct, listByVendor, listMyProducts, getProduct, updateProduct };
