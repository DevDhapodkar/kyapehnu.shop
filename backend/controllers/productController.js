import Product from '../models/Product.js';

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

export { createProduct, listByVendor, getProduct, updateProduct };
