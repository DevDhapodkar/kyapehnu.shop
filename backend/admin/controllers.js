import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import { getSettings, updateSettings } from '../models/PlatformSetting.js';
import { advanceOrderStatus } from '../services/orderService.js';
import { imageUploadsEnabled, uploadBufferToCloudinary } from '../services/imageStorage.js';
import { rupeesToPaise } from '../lib/money.js';
import { loadEnv } from '../config/env.js';
import { signAdminToken, adminCookieOptions } from '../middleware/adminAuth.js';
import { log } from '../lib/logger.js';
import * as V from './views.js';

const env = loadEnv();
const asyncPage = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ------------------------------------------------------------------- auth -- */

export const showLogin = (req, res) => res.send(V.loginPage(null));

export const doLogin = asyncPage(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!admin || !admin.isActive || !(await admin.verifyPassword(password || ''))) {
    log.warn('Failed admin login attempt', { email });
    return res.status(401).send(V.loginPage('Invalid email or password'));
  }
  admin.lastLoginAt = new Date();
  await admin.save();
  res.cookie(env.admin.cookieName, signAdminToken(admin), adminCookieOptions());
  res.redirect('/admin');
});

export const doLogout = (req, res) => {
  res.clearCookie(env.admin.cookieName, { path: '/' });
  res.redirect('/admin/login');
};

/* -------------------------------------------------------------- dashboard -- */

const sumField = async (match, field) => {
  const [row] = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$pricing.${field}` } } },
  ]);
  return row?.total || 0;
};

export const dashboard = asyncPage(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const live = ['PENDING', 'ACCEPTED', 'READY_FOR_PICKUP', 'IN_TRANSIT'];

  const [
    pendingProducts,
    approvedProducts,
    pendingVendors,
    approvedVendors,
    customers,
    ordersToday,
    liveOrders,
    gmvPaise,
    earningsPaise,
  ] = await Promise.all([
    Product.countDocuments({ status: 'PENDING_APPROVAL' }),
    Product.countDocuments({ status: 'APPROVED' }),
    Vendor.countDocuments({ status: 'PENDING_APPROVAL' }),
    Vendor.countDocuments({ status: 'APPROVED' }),
    User.countDocuments({ role: 'CUSTOMER' }),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.countDocuments({ status: { $in: live } }),
    sumField({ status: 'DELIVERED' }, 'grandTotalPaise'),
    sumField({ status: 'DELIVERED' }, 'platformEarningsPaise'),
  ]);

  res.send(
    V.dashboardPage(
      {
        pendingProducts,
        approvedProducts,
        pendingVendors,
        approvedVendors,
        customers,
        ordersToday,
        liveOrders,
        gmvPaise,
        earningsPaise,
      },
      req.admin
    )
  );
});

/* --------------------------------------------------------------- products -- */

const enc = encodeURIComponent;

export const listProducts = asyncPage(async (req, res) => {
  const status = (req.query.status || 'PENDING_APPROVAL').toUpperCase();
  const filter = status === 'ALL' ? {} : { status };
  const [products, settings] = await Promise.all([
    Product.find(filter)
      .populate('vendor', 'shopName')
      .sort({ createdAt: status === 'PENDING_APPROVAL' ? 1 : -1 })
      .limit(200),
    getSettings(),
  ]);
  res.send(V.productsPage(products, settings, status, imageUploadsEnabled(), req.admin, req.query.flash));
});

export const productDetail = asyncPage(async (req, res) => {
  const [product, settings] = await Promise.all([
    Product.findById(req.params.id).populate('vendor', 'shopName'),
    getSettings(),
  ]);
  if (!product) {
    return res.status(404).send(V.layout('Not found', '<h1>Product not found</h1>', { admin: req.admin }));
  }
  res.send(V.productDetailPage(product, settings, imageUploadsEnabled(), req.admin, req.query.flash));
});

export const uploadProductImage = asyncPage(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.redirect('/admin/products');
  const back = `/admin/products/${product._id}?flash=`;
  if (!imageUploadsEnabled()) {
    return res.redirect(back + enc('Image uploads are not configured (set CLOUDINARY_* env).'));
  }
  if (!req.file) return res.redirect(back + enc('No file selected.'));
  const url = await uploadBufferToCloudinary(req.file.buffer, {
    subfolder: `vendors/${product.vendor}`,
    filename: req.file.originalname,
  });
  // Newest becomes the primary image; keep at most 10, de-duplicated.
  product.images = [url, ...(product.images || []).filter((u) => u !== url)].slice(0, 10);
  await product.save();
  res.redirect(back + enc('Image uploaded.'));
});

export const removeProductImage = asyncPage(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.redirect('/admin/products');
  product.images = (product.images || []).filter((u) => u !== req.body.url);
  await product.save();
  res.redirect(`/admin/products/${product._id}?flash=` + enc('Image removed.'));
});

export const approveProduct = asyncPage(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.redirect('/admin/products');
  product.marginPaise = rupeesToPaise(req.body.marginRupees);
  product.status = 'APPROVED';
  product.moderation = { reviewedBy: req.admin._id, reviewedAt: new Date() };
  await product.save(); // pre-save sets sellingPricePaise = base + margin
  log.info('Product approved', { productId: product._id.toString(), marginPaise: product.marginPaise });
  res.redirect('/admin/products?flash=' + encodeURIComponent(`Approved ${product.name}`));
});

export const rejectProduct = asyncPage(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.redirect('/admin/products');
  product.status = 'REJECTED';
  product.moderation = { reviewedBy: req.admin._id, reviewedAt: new Date(), rejectionReason: req.body.reason };
  await product.save();
  res.redirect('/admin/products?flash=' + encodeURIComponent(`Rejected ${product.name}`));
});

/* ---------------------------------------------------------------- vendors -- */

export const listVendors = asyncPage(async (req, res) => {
  const vendors = await Vendor.find({ status: 'PENDING_APPROVAL' }).sort({ createdAt: 1 }).limit(200);
  res.send(V.vendorsPage(vendors, req.admin, req.query.flash));
});

export const approveVendor = asyncPage(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.redirect('/admin/vendors');
  vendor.status = 'APPROVED';
  vendor.moderation = { reviewedBy: req.admin._id, reviewedAt: new Date() };
  await vendor.save(); // pre-save sets isActive = true
  res.redirect('/admin/vendors?flash=' + encodeURIComponent(`Approved ${vendor.shopName}`));
});

export const rejectVendor = asyncPage(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.redirect('/admin/vendors');
  vendor.status = 'REJECTED';
  vendor.moderation = { reviewedBy: req.admin._id, reviewedAt: new Date(), rejectionReason: req.body.reason };
  await vendor.save();
  res.redirect('/admin/vendors?flash=' + encodeURIComponent(`Rejected ${vendor.shopName}`));
});

/* ----------------------------------------------------------------- orders -- */

export const listOrders = asyncPage(async (req, res) => {
  const status = (req.query.status || 'ALL').toUpperCase();
  const filter = status === 'ALL' ? {} : { status };
  const orders = await Order.find(filter)
    .populate('customer', 'name')
    .populate('vendor', 'shopName')
    .sort({ createdAt: -1 })
    .limit(100);
  res.send(V.ordersPage(orders, status, req.admin));
});

export const orderDetail = asyncPage(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone')
    .populate('vendor', 'shopName');
  if (!order) return res.status(404).send(V.layout('Not found', '<h1>Order not found</h1>', { admin: req.admin }));
  const invoice = await Invoice.findOne({ order: order._id });
  res.send(V.orderDetailPage(order, invoice, req.admin, req.query.flash));
});

export const cancelOrder = asyncPage(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.redirect('/admin/orders');
  try {
    await advanceOrderStatus(order, 'CANCELLED', 'ADMIN', { reason: req.body.reason });
    res.redirect(`/admin/orders/${order._id}?flash=` + encodeURIComponent('Order cancelled and stock restored'));
  } catch (err) {
    res.redirect(`/admin/orders/${order._id}?flash=` + encodeURIComponent(err.message));
  }
});

export const viewInvoice = asyncPage(async (req, res) => {
  const invoice = await Invoice.findOne({ order: req.params.id });
  if (!invoice) return res.status(404).send(V.layout('Not found', '<h1>Invoice not found</h1>', { admin: req.admin }));
  res.send(V.invoicePage(invoice));
});

/* --------------------------------------------------------------- settings -- */

export const showSettings = asyncPage(async (req, res) => {
  const settings = await getSettings();
  res.send(V.settingsPage(settings, req.admin, req.query.flash));
});

export const saveSettings = asyncPage(async (req, res) => {
  const b = req.body;
  const patch = {};
  if (b.platformFeeRupees !== undefined && b.platformFeeRupees !== '') patch.platformFeePaise = rupeesToPaise(b.platformFeeRupees);
  if (b.deliveryFeeRupees !== undefined && b.deliveryFeeRupees !== '') patch.deliveryFeePaise = rupeesToPaise(b.deliveryFeeRupees);
  if (b.defaultMarginRupees !== undefined && b.defaultMarginRupees !== '') patch.defaultMarginPaise = rupeesToPaise(b.defaultMarginRupees);
  if (b.codMaxOrderRupees !== undefined && b.codMaxOrderRupees !== '') patch.codMaxOrderPaise = rupeesToPaise(b.codMaxOrderRupees);
  if (b.taxBps !== undefined && b.taxBps !== '') patch.taxBps = parseInt(b.taxBps, 10) || 0;
  await updateSettings(patch);
  res.redirect('/admin/settings?flash=' + encodeURIComponent('Settings saved'));
});
