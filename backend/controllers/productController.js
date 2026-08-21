import Product from '../models/Product.js';
import {
  PRODUCT_STATUS,
  PRODUCT_SOURCE,
  requiresRequalification,
} from '../utils/productStatus.js';

// Fields the client may never set directly — the server owns the moderation state.
const PROTECTED_FIELDS = ['status', 'source', 'sku', 'qc', 'vendor', '_id'];

const stripProtected = (body = {}) => {
  const clean = { ...body };
  for (const field of PROTECTED_FIELDS) delete clean[field];
  return clean;
};

/** POST /api/products (vendor) — always enters the QC queue. */
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...stripProtected(req.body),
      vendor: req.vendor._id,
      source: PRODUCT_SOURCE.APP,
      status: PRODUCT_STATUS.PENDING_QC,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

/**
 * GET /api/products — public storefront feed. Only APPROVED + available items.
 * Optional ?category= and pagination via ?page=&limit=.
 */
const listStorefront = async (req, res) => {
  try {
    const filter = { status: PRODUCT_STATUS.APPROVED, isAvailable: true };
    if (req.query.category) filter.category = req.query.category;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate('vendor', 'shopName area location')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ items, meta: { total, page, limit } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load storefront', error: error.message });
  }
};

/** GET /api/products/vendor/:vendorId — a single shop's public storefront. */
const listByVendor = async (req, res) => {
  try {
    const products = await Product.find({
      vendor: req.params.vendorId,
      status: PRODUCT_STATUS.APPROVED,
      isAvailable: true,
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list products', error: error.message });
  }
};

/**
 * Catalog feed for the vendor app. Unlike the storefront queries this returns
 * every status (pending, rejected, out-of-stock) — the vendor has to see a
 * hidden item in order to act on it.
 */
const listMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.vendor._id }).sort({ updatedAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list catalog', error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'vendor',
      'shopName address location'
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

/**
 * PATCH /api/products/:id (vendor). Stock/availability edits stay live; content
 * edits (or a >20% price swing) send an APPROVED listing back to QC.
 */
const updateProduct = async (req, res) => {
  try {
    const existing = await Product.findOne({ _id: req.params.id, vendor: req.vendor._id });
    if (!existing) return res.status(404).json({ message: 'Product not found for this vendor' });

    const update = stripProtected(req.body);

    if (
      existing.status === PRODUCT_STATUS.APPROVED &&
      requiresRequalification(update, { price: existing.price })
    ) {
      update.status = PRODUCT_STATUS.PENDING_QC;
    }

    existing.set(update);
    await existing.save();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

export { createProduct, listStorefront, listByVendor, listMyProducts, getProduct, updateProduct };
