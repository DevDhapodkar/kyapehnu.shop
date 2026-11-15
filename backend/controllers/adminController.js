import crypto from 'crypto';
import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import PlatformConfig from '../models/PlatformConfig.js';
import { verifyPassword, hashPassword, signAdminToken } from '../utils/adminAuth.js';
import { PRODUCT_STATUS, statusForReview } from '../utils/productStatus.js';
import { buildUniqueSku } from '../utils/sku.js';
import { deleteAllFirebaseUsers, listAllFirebaseUsers } from '../config/firebase.js';

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
    // App products already carry a SKU from create; this only backfills a
    // product that reached approval without one (e.g. a seeded/imported item).
    if (nextStatus === PRODUCT_STATUS.APPROVED) {
      if (!product.sku) {
        product.sku = await buildUniqueSku(product.category, (sku) =>
          Product.exists({ sku }).then(Boolean)
        );
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

/** GET /api/admin/vendors?status=PENDING&q=query */
export const listVendors = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.approvalStatus = req.query.status;
    if (req.query.q) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      filter.$or = [
        { shopName: regex },
        { ownerName: regex },
        { phone: regex },
        { whatsappNumber: regex },
        { 'address.area': regex },
      ];
    }
    const vendors = await Vendor.find(filter).sort({ createdAt: -1 });

    const productCounts = await Product.aggregate([
      { $group: { _id: '$vendor', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    productCounts.forEach((pc) => {
      countMap[String(pc._id)] = pc.count;
    });

    const enriched = vendors.map((v) => ({
      ...v.toObject(),
      productCount: countMap[String(v._id)] || 0,
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load vendors', error: error.message });
  }
};

/** GET /api/admin/vendors/:id — get boutique details with catalog */
export const getVendorDetails = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const products = await Product.find({ vendor: vendor._id }).sort({ createdAt: -1 });
    const ordersCount = await Order.countDocuments({ vendor: vendor._id });
    res.json({
      vendor,
      products,
      ordersCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get vendor details', error: error.message });
  }
};

/** PATCH /api/admin/vendors/:id — update boutique details without code changes */
export const updateVendorAsAdmin = async (req, res) => {
  try {
    const updates = req.body ?? {};
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    if (updates.shopName) vendor.shopName = updates.shopName.trim();
    if (updates.ownerName) vendor.ownerName = updates.ownerName.trim();
    if (updates.phone) vendor.phone = updates.phone.trim();
    if (updates.whatsappNumber) vendor.whatsappNumber = updates.whatsappNumber.trim();
    if (updates.email) vendor.email = updates.email.trim();
    if (updates.approvalStatus) vendor.approvalStatus = updates.approvalStatus;
    if (typeof updates.isActive === 'boolean') vendor.isActive = updates.isActive;
    if (updates.rating !== undefined) vendor.rating = Number(updates.rating) || 0;

    if (updates.address) {
      vendor.address = {
        line1: updates.address.line1 || vendor.address?.line1 || '',
        area: updates.address.area || vendor.address?.area || '',
        city: updates.address.city || vendor.address?.city || 'India',
        pincode: String(updates.address.pincode || vendor.address?.pincode || '440001'),
      };
    }

    if (updates.location?.coordinates && Array.isArray(updates.location.coordinates)) {
      vendor.location = {
        type: 'Point',
        coordinates: [
          Number(updates.location.coordinates[0]),
          Number(updates.location.coordinates[1]),
        ],
      };
    }

    if (Array.isArray(updates.operatingHours)) {
      vendor.operatingHours = updates.operatingHours;
    }

    await vendor.save();
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vendor', error: error.message });
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
    if (!shopName || !ownerName || !phone || !/^\d{6}$/.test(String(pincode || ''))) {
      return res.status(400).json({ message: 'shopName, ownerName, phone and 6-digit pincode are required' });
    }
    const vendor = await Vendor.create({
      firebaseUid: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      shopName,
      ownerName,
      phone,
      whatsappNumber: whatsappNumber || phone,
      email: email || `${shopName.toLowerCase().replace(/\s+/g, '')}@kyapehnu.local`,
      address: { line1: line1 || area || '', area: area || '', city: 'India', pincode: String(pincode) },
      location: { type: 'Point', coordinates: [Number(lng) || 78.9629, Number(lat) || 20.5937] },
      approvalStatus: 'APPROVED',
      isActive: true,
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create shop', error: error.message });
  }
};

/** GET /api/admin/products — browse all catalog products with search & filters */
export const listAllProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category.toUpperCase();
    if (req.query.vendor) filter.vendor = req.query.vendor;
    if (req.query.q) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      filter.$or = [
        { name: regex },
        { brand: regex },
        { sku: regex },
        { material: regex },
        { description: regex },
      ];
    }

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const skip = Number(req.query.skip) || 0;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendor', 'shopName ownerName area phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, limit, skip });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list products', error: error.message });
  }
};

/** GET /api/admin/products/:id — get product by id */
export const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'shopName ownerName phone address location');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get product', error: error.message });
  }
};

/** PATCH /api/admin/products/:id — edit full product attributes without touching code */
export const updateProductAsAdmin = async (req, res) => {
  try {
    const updates = req.body ?? {};
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (updates.name) product.name = updates.name.trim();
    if (updates.description !== undefined) product.description = updates.description?.trim();
    if (updates.brand !== undefined) product.brand = updates.brand?.trim();
    if (updates.category) product.category = updates.category.toUpperCase();
    if (updates.subCategory !== undefined) product.subCategory = updates.subCategory?.trim();
    if (updates.price !== undefined && Number(updates.price) > 0) product.price = Number(updates.price);
    if (updates.mrp !== undefined) product.mrp = Number(updates.mrp) > 0 ? Number(updates.mrp) : product.price;
    if (typeof updates.isAvailable === 'boolean') product.isAvailable = updates.isAvailable;
    if (updates.status) product.status = updates.status;
    if (updates.material !== undefined) product.material = updates.material?.trim();
    if (updates.pattern !== undefined) product.pattern = updates.pattern?.trim();
    if (updates.fit !== undefined) product.fit = updates.fit?.trim();
    if (updates.sleeve !== undefined) product.sleeve = updates.sleeve?.trim();
    if (updates.neck !== undefined) product.neck = updates.neck?.trim();
    if (updates.netQuantity !== undefined) product.netQuantity = Number(updates.netQuantity) || 1;

    if (Array.isArray(updates.images)) product.images = updates.images;
    if (Array.isArray(updates.colors)) product.colors = updates.colors;
    if (Array.isArray(updates.sizes)) product.sizes = updates.sizes;
    if (Array.isArray(updates.variants)) product.variants = updates.variants;
    if (updates.vendor) product.vendor = updates.vendor;

    await product.save();
    const populated = await Product.findById(product._id).populate('vendor', 'shopName area phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

/** POST /api/admin/products — operator adds a product (auto-approved, live). */
export const createProductAsAdmin = async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.vendor || !body.name || !(Number(body.price) > 0) || !body.category) {
      return res.status(400).json({ message: 'vendor, name, price and category are required' });
    }
    const sku = await buildUniqueSku(body.category, (candidate) =>
      Product.exists({ sku: candidate }).then(Boolean)
    );
    const product = await Product.create({
      ...body,
      price: Number(body.price),
      mrp: body.mrp ? Number(body.mrp) : undefined,
      source: 'ADMIN',
      status: PRODUCT_STATUS.APPROVED,
      sku,
      qc: { reviewedBy: req.admin._id, reviewedAt: new Date() },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

/** GET /api/admin/orders?status=...&q=... */
export const listOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;

    if (req.query.q) {
      const q = req.query.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { 'guestContact.name': regex },
        { 'guestContact.phone': regex },
        { 'deliveryAddress.receiverName': regex },
        { 'deliveryAddress.receiverPhone': regex },
        { paymentUtr: regex },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(q)) {
        filter.$or.push({ _id: q });
      }
    }

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const orders = await Order.find(filter)
      .populate('vendor', 'shopName ownerName phone whatsappNumber address location')
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders', error: error.message });
  }
};

/** GET /api/admin/orders/:id — deep populate full order details */
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('vendor', 'shopName ownerName phone whatsappNumber address location')
      .populate('customer', 'name phone email savedAddresses')
      .populate('items.product', 'images brand category');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order details', error: error.message });
  }
};

/** GET /api/admin/config — get live platform settings */
export const getAdminConfig = async (req, res) => {
  try {
    const config = await PlatformConfig.getGlobal();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get config', error: error.message });
  }
};

/** PATCH /api/admin/config — update live platform settings */
export const updateAdminConfig = async (req, res) => {
  try {
    const updates = req.body ?? {};
    let config = await PlatformConfig.getGlobal();

    if (updates.delivery) {
      config.delivery = {
        ...config.delivery.toObject(),
        ...updates.delivery,
      };
    }
    if (updates.announcement) {
      config.announcement = {
        ...config.announcement.toObject(),
        ...updates.announcement,
      };
    }
    if (updates.payments) {
      config.payments = {
        ...config.payments.toObject(),
        ...updates.payments,
      };
    }
    if (updates.maintenance) {
      config.maintenance = {
        ...config.maintenance.toObject(),
        ...updates.maintenance,
      };
    }
    if (updates.support) {
      config.support = {
        ...config.support.toObject(),
        ...updates.support,
      };
    }

    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update config', error: error.message });
  }
};

/** GET /api/admin/stats — headline analytics & business KPIs */
export const getStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      pendingProducts,
      pendingVendors,
      totalVendors,
      totalOrders,
      totalUsers,
      totalProducts,
      todayOrdersCount,
      gmvAggregate,
      todayGmvAggregate,
      ordersByStatus,
      paymentSplit,
    ] = await Promise.all([
      Product.countDocuments({ status: PRODUCT_STATUS.PENDING_QC }),
      Vendor.countDocuments({ approvalStatus: 'PENDING' }),
      Vendor.countDocuments({}),
      Order.countDocuments({}),
      User.countDocuments({}),
      Product.countDocuments({}),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, totalGmv: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'CANCELLED' }, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, todayGmv: { $sum: '$totalPrice' } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } },
      ]),
    ]);

    const totalGmv = gmvAggregate[0]?.totalGmv || 0;
    const todayGmv = todayGmvAggregate[0]?.todayGmv || 0;

    const statusCounts = {};
    ordersByStatus.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    res.json({
      pendingProducts,
      pendingVendors,
      totalVendors,
      totalOrders,
      totalUsers,
      totalProducts,
      todayOrdersCount,
      totalGmv,
      todayGmv,
      statusCounts,
      paymentSplit,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load stats', error: error.message });
  }
};

/** POST /api/admin/system-wipe-test-data */
export const systemWipeTestData = async (req, res) => {
  // 1. Strict Role Authorization
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Super admin privileges required' });
  }

  // 2. Strict Environment Check: Never allow on production deploys
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Forbidden: System wipe is permanently disabled in production' });
  }

  // 3. Opt-in Flag Check
  if (process.env.ALLOW_SYSTEM_WIPE !== 'true') {
    return res.status(403).json({ message: 'Forbidden: System wipe is not enabled on this instance' });
  }

  // 4. Constant-Time Secret Validation from Environment
  const systemWipeSecret = process.env.SYSTEM_WIPE_SECRET;
  if (!systemWipeSecret) {
    return res.status(503).json({ message: 'SYSTEM_WIPE_SECRET is not configured on this server' });
  }

  const providedSecret = String(req.headers['x-admin-wipe-secret'] || req.body?.secret || '');
  const secretBuf = Buffer.from(systemWipeSecret, 'utf8');
  const providedBuf = Buffer.from(providedSecret, 'utf8');

  if (secretBuf.length !== providedBuf.length || !crypto.timingSafeEqual(secretBuf, providedBuf)) {
    return res.status(401).json({ message: 'Unauthorized: Invalid wipe secret' });
  }

  try {
    const [deletedOrders, deletedProducts, deletedVendors, deletedUsers] = await Promise.all([
      Order.deleteMany({}),
      Product.deleteMany({}),
      Vendor.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Ensure super admin exists safely using configured or generated credential
    const email = req.admin.email || process.env.ADMIN_EMAIL || 'admin@kyapehnu.com';
    const fallbackPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
    const passwordHash = req.admin.passwordHash || (await hashPassword(fallbackPassword));

    const admin = await Admin.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          passwordHash,
          name: req.admin.name || 'Super Admin',
          role: 'SUPER_ADMIN',
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      success: true,
      message: 'All test data deleted successfully from database',
      deleted: {
        orders: deletedOrders.deletedCount,
        products: deletedProducts.deletedCount,
        vendors: deletedVendors.deletedCount,
        users: deletedUsers.deletedCount,
      },
      admin: { email: admin.email, role: admin.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to wipe database', error: error.message });
  }
};

/** GET /api/admin/users — list registered customer profiles with search and order stats */
export const listUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.q) {
      const regex = new RegExp(req.query.q.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(limit);

    const userIds = users.map((u) => u._id);
    const ordersAggregate = await Order.aggregate([
      { $match: { customer: { $in: userIds } } },
      {
        $group: {
          _id: '$customer',
          orderCount: { $sum: 1 },
          totalSpend: { $sum: '$totalPrice' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const orderMap = {};
    ordersAggregate.forEach((agg) => {
      orderMap[String(agg._id)] = agg;
    });

    const enriched = users.map((u) => {
      const stat = orderMap[String(u._id)] || {};
      return {
        ...u.toObject(),
        orderCount: stat.orderCount || 0,
        totalSpend: stat.totalSpend || 0,
        lastOrderAt: stat.lastOrderAt || null,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list users', error: error.message });
  }
};

/** GET /api/admin/users/:id — get customer details with all orders */
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    const orders = await Order.find({ customer: user._id })
      .populate('vendor', 'shopName area phone')
      .sort({ createdAt: -1 });
    res.json({
      user,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get customer details', error: error.message });
  }
};

/** PATCH /api/admin/users/:id — update customer profile details */
export const updateUserAsAdmin = async (req, res) => {
  try {
    const updates = req.body ?? {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });

    if (updates.name) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.email) user.email = updates.email.trim().toLowerCase();

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
};

/** DELETE /api/admin/users/:id — remove customer account */
export const deleteUserAsAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Customer not found' });
    res.json({ success: true, message: `Customer ${user.name} removed successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
};

/** DELETE /api/admin/vendors/:id — remove specific vendor and its products */
export const deleteVendorAsAdmin = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    const deletedProducts = await Product.deleteMany({ vendor: req.params.id });
    res.json({
      success: true,
      message: `Vendor ${vendor.shopName} and ${deletedProducts.deletedCount} products deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vendor', error: error.message });
  }
};

/** DELETE /api/admin/products/:id — remove specific product */
export const deleteProductAsAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, message: `Product ${product.name} deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

/**
 * POST /api/admin/clean-slate
 * Super-admin action: wipes all customer accounts, vendor accounts, products, orders,
 * and clears Firebase auth users. Returns full audit of everything deleted.
 */
export const cleanSlate = async (req, res) => {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Super admin privileges required' });
  }

  try {
    const [deletedOrders, deletedProducts, deletedVendors, deletedUsers] = await Promise.all([
      Order.deleteMany({}),
      Product.deleteMany({}),
      Vendor.deleteMany({}),
      User.deleteMany({}),
    ]);

    const fbResult = await deleteAllFirebaseUsers();

    res.json({
      success: true,
      message: 'Clean slate completed successfully',
      deleted: {
        customers: deletedUsers.deletedCount,
        vendors: deletedVendors.deletedCount,
        products: deletedProducts.deletedCount,
        orders: deletedOrders.deletedCount,
        firebaseUsers: fbResult.count,
      },
      firebaseErrors: fbResult.errors?.length ? fbResult.errors : undefined,
    });
  } catch (error) {
    console.error('[cleanSlate] Error:', error);
    res.status(500).json({ message: 'Failed to clean slate', error: error.message });
  }
};

