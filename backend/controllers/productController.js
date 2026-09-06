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

/** POST /api/products (vendor) — enters QC or approved if vendor is verified. */
const createProduct = async (req, res) => {
  try {
    const isApprovedVendor = req.vendor?.approvalStatus === 'APPROVED';
    const status =
      process.env.NODE_ENV !== 'production' || isApprovedVendor
        ? PRODUCT_STATUS.APPROVED
        : PRODUCT_STATUS.PENDING_QC;

    const body = stripProtected(req.body);

    // Normalize category to uppercase enum value
    if (body.category) {
      body.category = String(body.category).trim().toUpperCase();
    }

    // Auto-generate unique SKU if not assigned
    if (!body.sku) {
      const catCode = (body.category || 'PRD').slice(0, 2).toUpperCase();
      body.sku = `${catCode}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    }

    // Default MRP if omitted: standard 25% markup
    if (!body.mrp && body.price) {
      body.mrp = Math.round(Number(body.price) * 1.25);
    }

    // Sanitize sizes array: require non-empty size string and non-negative stock
    if (Array.isArray(body.sizes)) {
      body.sizes = body.sizes
        .filter((s) => s && s.size && typeof s.size === 'string' && s.size.trim())
        .map((s) => ({
          size: s.size.trim(),
          stock: Math.max(0, parseInt(s.stock, 10) || 0),
        }));
    }

    // Sanitize images array
    if (Array.isArray(body.images)) {
      body.images = body.images.filter((img) => img && typeof img === 'string' && img.trim());
    }

    const product = await Product.create({
      ...body,
      vendor: req.vendor._id,
      source: PRODUCT_SOURCE.APP,
      status,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('[createProduct error]:', error);
    res.status(500).json({
      message: error.message || 'Failed to create product',
      error: error.message,
    });
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

    // Content edits to an APPROVED listing (or any fix to a REJECTED one) send
    // it back through QC. Stock/availability toggles on an approved item stay live.
    if (
      existing.status === PRODUCT_STATUS.REJECTED ||
      (existing.status === PRODUCT_STATUS.APPROVED &&
        requiresRequalification(update, { price: existing.price }))
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
