import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';

import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import User from './models/User.js';
import PlatformConfig from './models/PlatformConfig.js';
import { hashPassword, signAdminToken } from './utils/adminAuth.js';

import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

test('Admin Panel Feature-Full Integration Suite', async (t) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';
  await mongoose.connect(mongoUri);

  // Setup Admin
  let admin = await Admin.findOne({ email: 'test_admin@kyapehnu.local' });
  if (!admin) {
    admin = await Admin.create({
      email: 'test_admin@kyapehnu.local',
      passwordHash: await hashPassword('TestAdminPassword123'),
      name: 'Test Super Admin',
      role: 'SUPER_ADMIN',
    });
  }
  const token = signAdminToken(admin);
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const app = express();
  app.use(express.json());
  app.get('/api/config', async (req, res) => {
    const cfg = await PlatformConfig.getGlobal();
    res.json(cfg);
  });
  app.use('/api/admin', adminRoutes);

  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  t.after(async () => {
    server.close();
    await mongoose.disconnect();
  });

  let testVendorId;
  let testProductId;
  let testUserId;
  let testOrderId;

  await t.test('1. Platform Configuration: Fetch and Update without code changes', async () => {
    // Public fetch
    const pubRes = await fetch(`${baseUrl}/api/config`);
    assert.equal(pubRes.status, 200);
    const pubData = await pubRes.json();
    assert.equal(pubData.key, 'global');

    // Admin fetch
    const getRes = await fetch(`${baseUrl}/api/admin/config`, { headers: authHeaders });
    assert.equal(getRes.status, 200);
    const cfg = await getRes.json();
    assert.ok(cfg.delivery);

    // Admin update announcement and delivery fee
    const updateRes = await fetch(`${baseUrl}/api/admin/config`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        delivery: { baseFee: 35, freeDeliveryThreshold: 799 },
        announcement: { enabled: true, text: 'Special Diwali Sale: Express delivery across India!' },
      }),
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.delivery.baseFee, 35);
    assert.equal(updated.delivery.freeDeliveryThreshold, 799);
    assert.equal(updated.announcement.text, 'Special Diwali Sale: Express delivery across India!');
  });

  await t.test('2. Vendor Management: Create, Search, Details, and Edit without code', async () => {
    // Create vendor
    const createRes = await fetch(`${baseUrl}/api/admin/vendors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        shopName: 'Heritage Silks Dharampeth',
        ownerName: 'Sunita Joshi',
        phone: '9822001122',
        area: 'Dharampeth',
        line1: 'Near Coffee House, West High Court Road',
        pincode: '440010',
      }),
    });
    assert.equal(createRes.status, 201);
    const vendor = await createRes.json();
    testVendorId = vendor._id;
    assert.equal(vendor.shopName, 'Heritage Silks Dharampeth');
    assert.equal(vendor.approvalStatus, 'APPROVED');

    // Search vendor
    const searchRes = await fetch(`${baseUrl}/api/admin/vendors?q=Heritage`, { headers: authHeaders });
    assert.equal(searchRes.status, 200);
    const list = await searchRes.json();
    assert.ok(list.some((v) => v._id === testVendorId));

    // Edit vendor
    const patchRes = await fetch(`${baseUrl}/api/admin/vendors/${testVendorId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        shopName: 'Heritage Royal Silks',
        phone: '9822003344',
        isActive: false,
        rating: 4.8,
      }),
    });
    assert.equal(patchRes.status, 200);
    const updatedVendor = await patchRes.json();
    assert.equal(updatedVendor.shopName, 'Heritage Royal Silks');
    assert.equal(updatedVendor.phone, '9822003344');
    assert.equal(updatedVendor.isActive, false);
    assert.equal(updatedVendor.rating, 4.8);

    // Vendor details
    const detRes = await fetch(`${baseUrl}/api/admin/vendors/${testVendorId}`, { headers: authHeaders });
    assert.equal(detRes.status, 200);
    const det = await detRes.json();
    assert.equal(det.vendor._id, testVendorId);
  });

  await t.test('3. Product Catalog: Create, Browse, Search, and Edit attributes', async () => {
    // Create product
    const createRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        vendor: testVendorId,
        name: 'Paithani Silk Kurta Set',
        category: 'WOMEN',
        price: 3499,
        mrp: 4999,
        brand: 'Heritage Royal',
        sizes: [{ size: 'M', stock: 5 }, { size: 'L', stock: 3 }],
        material: 'Pure Silk',
      }),
    });
    assert.equal(createRes.status, 201);
    const product = await createRes.json();
    testProductId = product._id;
    assert.equal(product.name, 'Paithani Silk Kurta Set');
    assert.equal(product.price, 3499);

    // List all products with search
    const listRes = await fetch(`${baseUrl}/api/admin/products?q=Paithani&category=WOMEN`, { headers: authHeaders });
    assert.equal(listRes.status, 200);
    const catalog = await listRes.json();
    assert.ok(catalog.products.some((p) => p._id === testProductId));

    // Edit product (adjust price, MRP, in-stock availability, sizes)
    const patchRes = await fetch(`${baseUrl}/api/admin/products/${testProductId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        price: 2999,
        mrp: 5499,
        isAvailable: false,
        brand: 'Heritage Couture India',
        sizes: [{ size: 'M', stock: 10 }, { size: 'XL', stock: 4 }],
      }),
    });
    assert.equal(patchRes.status, 200);
    const updatedProduct = await patchRes.json();
    assert.equal(updatedProduct.price, 2999);
    assert.equal(updatedProduct.mrp, 5499);
    assert.equal(updatedProduct.isAvailable, false);
    assert.equal(updatedProduct.brand, 'Heritage Couture India');
    assert.equal(updatedProduct.sizes.length, 2);
  });

  await t.test('4. Customer Management: List, Search, Details, and Edit', async () => {
    // Create test user
    const user = await User.create({
      firebaseUid: `cust_${Date.now()}`,
      name: 'Rohan Deshmukh',
      email: `rohan_${Date.now()}@example.com`,
      phone: '9890123456',
    });
    testUserId = user._id;

    // List with search
    const listRes = await fetch(`${baseUrl}/api/admin/users?q=Rohan`, { headers: authHeaders });
    assert.equal(listRes.status, 200);
    const users = await listRes.json();
    assert.ok(users.some((u) => u._id === String(testUserId)));

    // Edit customer
    const patchRes = await fetch(`${baseUrl}/api/admin/users/${testUserId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Rohan D. Deshmukh',
        phone: '9890998877',
      }),
    });
    assert.equal(patchRes.status, 200);
    const updatedUser = await patchRes.json();
    assert.equal(updatedUser.name, 'Rohan D. Deshmukh');
    assert.equal(updatedUser.phone, '9890998877');

    // Customer details
    const detRes = await fetch(`${baseUrl}/api/admin/users/${testUserId}`, { headers: authHeaders });
    assert.equal(detRes.status, 200);
    const details = await detRes.json();
    assert.equal(details.user._id, String(testUserId));
  });

  await t.test('5. Orders & Logistics: Search, Filter, and Inspect Details', async () => {
    // Create order for test user
    const order = await Order.create({
      customer: testUserId,
      vendor: testVendorId,
      items: [
        {
          product: testProductId,
          name: 'Paithani Silk Kurta Set',
          size: 'M',
          quantity: 1,
          price: 2999,
        },
      ],
      totalPrice: 2999,
      deliveryAddress: {
        line1: 'B-12, Linking Road',
        city: 'Mumbai',
        pincode: '400050',
        receiverName: 'Rohan D. Deshmukh',
        receiverPhone: '9890998877',
        location: { type: 'Point', coordinates: [72.83, 19.06] },
      },
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      paymentUtr: 'UTR998877665544',
      status: 'PENDING',
    });
    testOrderId = order._id;

    // Filter orders by paymentStatus and status
    const filterRes = await fetch(`${baseUrl}/api/admin/orders?paymentStatus=PAID`, { headers: authHeaders });
    assert.equal(filterRes.status, 200);
    const orders = await filterRes.json();
    assert.ok(orders.some((o) => o._id === String(testOrderId)));

    // Search orders by UTR
    const searchRes = await fetch(`${baseUrl}/api/admin/orders?q=UTR998877665544`, { headers: authHeaders });
    assert.equal(searchRes.status, 200);
    const searchOrders = await searchRes.json();
    assert.ok(searchOrders.some((o) => o._id === String(testOrderId)));

    // Full order details inspection
    const detRes = await fetch(`${baseUrl}/api/admin/orders/${testOrderId}`, { headers: authHeaders });
    assert.equal(detRes.status, 200);
    const det = await detRes.json();
    assert.equal(det._id, String(testOrderId));
    assert.equal(det.paymentUtr, 'UTR998877665544');
    assert.equal(det.items[0].name, 'Paithani Silk Kurta Set');
  });

  await t.test('6. Analytics & Business KPIs: GMV, Revenue, Splits', async () => {
    const statsRes = await fetch(`${baseUrl}/api/admin/stats`, { headers: authHeaders });
    assert.equal(statsRes.status, 200);
    const stats = await statsRes.json();
    assert.ok(stats.totalOrders >= 1);
    assert.ok(stats.totalGmv >= 2999);
    assert.ok(stats.todayGmv >= 2999);
    assert.ok(typeof stats.statusCounts === 'object');
    assert.ok(Array.isArray(stats.paymentSplit));
  });

  // Cleanup
  await Product.findByIdAndDelete(testProductId);
  await Vendor.findByIdAndDelete(testVendorId);
  await Order.findByIdAndDelete(testOrderId);
  await User.findByIdAndDelete(testUserId);

  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
});
