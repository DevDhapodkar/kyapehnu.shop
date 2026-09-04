import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';
import { verifyPassword, hashPassword, signAdminToken } from '../utils/adminAuth.js';
import { PRODUCT_STATUS, statusForReview } from '../utils/productStatus.js';
import { generateSku } from '../utils/sku.js';

/** GET /api/admin/needs-setup -> { needsSetup } (true when no admin exists yet). */
export const getSetupStatus = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    res.json({ needsSetup: count === 0 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check setup status', error: error.message });
  }
};

/**
 * POST /api/admin/setup { email, password, name } -> { token, admin }
 * First-run only: creates the very first admin from the browser so no dashboard
 * env vars are needed. Refuses once any admin exists (standard first-run guard).
 */
export const setupFirstAdmin = async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ message: 'Admin setup is already complete — please log in.' });
    }

    const admin = await Admin.create({
      email: String(email).toLowerCase().trim(),
      passwordHash: await hashPassword(password),
      name: name?.trim() || 'Admin',
      role: 'SUPER_ADMIN',
    });

    const token = signAdminToken(admin);
    res.status(201).json({
      token,
      admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ message: status === 503 ? error.message : 'Setup failed', error: error.message });
  }
};

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

/** PATCH /api/admin/products/:id/review  { decision: 'APPROVE'|'REJECT', reason?, mrp? } */
export const reviewProduct = async (req, res) => {
  const { decision, reason, mrp } = req.body ?? {};

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
    if (nextStatus === PRODUCT_STATUS.APPROVED) {
      if (!product.sku) {
        product.sku = generateSku(product.category);
      }
      // Official printed MRP decided by admin on approval
      if (mrp !== undefined && Number(mrp) > 0) {
        product.mrp = Number(mrp);
      } else if (!product.mrp) {
        product.mrp = product.price;
      }
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

/** POST /api/admin/vendors — operator creates an approved shop from the panel. */
export const createVendorAsAdmin = async (req, res) => {
  try {
    const { shopName, ownerName, phone, whatsappNumber, email, area, line1, pincode, lng, lat } = req.body ?? {};
    if (!shopName || !ownerName || !phone) {
      return res.status(400).json({ message: 'shopName, ownerName and phone are required' });
    }
    const vendor = await Vendor.create({
      firebaseUid: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      shopName,
      ownerName,
      phone,
      whatsappNumber: whatsappNumber || phone,
      email: email || `${shopName.toLowerCase().replace(/\s+/g, '')}@kyapehnu.local`,
      address: { line1: line1 || 'Nagpur', area: area || 'Nagpur', city: 'Nagpur', pincode: pincode || '440001' },
      location: { type: 'Point', coordinates: [Number(lng) || 79.0882, Number(lat) || 21.1458] },
      approvalStatus: 'APPROVED',
      isActive: true,
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create shop', error: error.message });
  }
};

/** POST /api/admin/products — operator adds a product (auto-approved, live). */
export const createProductAsAdmin = async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.vendor || !body.name || !(Number(body.price) > 0) || !body.category) {
      return res.status(400).json({ message: 'vendor, name, price and category are required' });
    }
    const product = await Product.create({
      ...body,
      price: Number(body.price),
      mrp: body.mrp ? Number(body.mrp) : undefined,
      source: 'ADMIN',
      status: PRODUCT_STATUS.APPROVED,
      sku: generateSku(body.category),
      qc: { reviewedBy: req.admin._id, reviewedAt: new Date() },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
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
