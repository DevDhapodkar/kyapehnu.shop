import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';
import { verifyPassword, signAdminToken } from '../utils/adminAuth.js';
import { PRODUCT_STATUS, statusForReview } from '../utils/productStatus.js';
import { generateSku } from '../utils/sku.js';

/** POST /api/admin/login  { email, password } -> { token, admin } */
export const login = async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });
    // Constant-ish response: same 401 whether the email or the password is wrong.
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signAdminToken(admin);
    res.json({
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: status === 503 ? error.message : 'Login failed', error: error.message });
  }
};

/** GET /api/admin/me */
export const getMe = (req, res) => {
  const { _id, email, name, role } = req.admin;
  res.json({ id: _id, email, name, role });
};

/** GET /api/admin/products/pending */
export const listPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: PRODUCT_STATUS.PENDING_QC })
      .populate('vendor', 'shopName area address whatsappNumber')
      .sort({ createdAt: 1 }); // oldest first — a real queue
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load QC queue', error: error.message });
  }
};

/** PATCH /api/admin/products/:id/review  { decision: 'APPROVE'|'REJECT', reason? } */
export const reviewProduct = async (req, res) => {
  const { decision, reason } = req.body ?? {};

  let nextStatus;
  try {
    nextStatus = statusForReview(decision);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  if (nextStatus === PRODUCT_STATUS.REJECTED && !reason) {
    return res.status(400).json({ message: 'A reason is required when rejecting' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.status = nextStatus;
    product.qc = { reviewedBy: req.admin._id, reviewedAt: new Date(), reason: reason || undefined };
    // Assign a human SKU on first approval only.
    if (nextStatus === PRODUCT_STATUS.APPROVED && !product.sku) {
      product.sku = generateSku(product.category);
    }
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to review product', error: error.message });
  }
};

/** GET /api/admin/vendors?status=PENDING */
export const listVendors = async (req, res) => {
  try {
    const filter = req.query.status ? { approvalStatus: req.query.status } : {};
    const vendors = await Vendor.find(filter).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load vendors', error: error.message });
  }
};

/** PATCH /api/admin/vendors/:id/review  { decision: 'APPROVE'|'REJECT' } */
export const reviewVendor = async (req, res) => {
  const { decision } = req.body ?? {};
  const approvalStatus =
    decision === 'APPROVE' ? 'APPROVED' : decision === 'REJECT' ? 'REJECTED' : null;
  if (!approvalStatus) {
    return res.status(400).json({ message: "decision must be 'APPROVE' or 'REJECT'" });
  }

  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { approvalStatus },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to review vendor', error: error.message });
  }
};

/** GET /api/admin/orders?status=PENDING&limit=50 */
export const listOrders = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const orders = await Order.find(filter)
      .populate('vendor', 'shopName')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders', error: error.message });
  }
};

/** GET /api/admin/stats — headline counts for the dashboard. */
export const getStats = async (req, res) => {
  try {
    const [pendingProducts, pendingVendors, totalVendors, totalOrders] = await Promise.all([
      Product.countDocuments({ status: PRODUCT_STATUS.PENDING_QC }),
      Vendor.countDocuments({ approvalStatus: 'PENDING' }),
      Vendor.countDocuments({}),
      Order.countDocuments({}),
    ]);
    res.json({ pendingProducts, pendingVendors, totalVendors, totalOrders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stats', error: error.message });
  }
};
