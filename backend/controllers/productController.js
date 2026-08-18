import Product from '../models/Product.js';

/**
 * Public storefront feed + search. Powers the customer shopping experience:
 * lists available products across every vendor, with optional facet filters and
 * a text query. No auth — this is the browse surface.
 *
 * Query params (all optional):
 *   department | category  MEN | WOMEN | KIDS | WATCHES | ACCESSORIES
 *   type | subCategory     Shirts, Dresses, Automatic, …
 *   q                      free-text search over name / description / type
 *   size                   e.g. M (matches a size with any stock)
 *   minPrice, maxPrice     price band (against the effective price)
 *   sort                   priceAsc | priceDesc | newest (default: newest)
 *   limit                  cap (default 100, max 200)
 */
const listProducts = async (req, res) => {
  try {
    const { department, category, type, subCategory, q, size, minPrice, maxPrice, sort } = req.query;

    const filter = { isAvailable: true };

    const dept = department || category;
    if (dept) filter.category = String(dept).toUpperCase();

    const sub = type || subCategory;
    if (sub) filter.subCategory = sub;

    if (size) filter['sizes.size'] = size;

    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }

    if (q && String(q).trim()) {
      // Escape regex metacharacters so a user's punctuation can't break the query.
      const safe = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ name: rx }, { description: rx }, { subCategory: rx }];
    }

    const sortMap = {
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      newest: { createdAt: -1 },
    };
    const sortBy = sortMap[sort] || sortMap.newest;

    const limit = Math.min(Number(req.query.limit) || 100, 200);

    const products = await Product.find(filter)
      .populate('vendor', 'shopName address location rating')
      .sort(sortBy)
      .limit(limit);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list products', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, vendor: req.vendor._id });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

const listByVendor = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.params.vendorId, isAvailable: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list products', error: error.message });
  }
};

/**
 * Catalog feed for the vendor app. Unlike `listByVendor` (the customer-facing
 * storefront query) this returns out-of-stock listings too — the vendor has to
 * see a hidden item in order to switch it back on.
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
    const product = await Product.findById(req.params.id).populate('vendor', 'shopName address location');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.vendor._id },
      req.body,
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found for this vendor' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

export { listProducts, createProduct, listByVendor, listMyProducts, getProduct, updateProduct };
