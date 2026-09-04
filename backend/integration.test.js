import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';

import connectDB from './config/db.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

import vendorRoutes from './routes/vendorRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

test('E2E Storefront and Order Lifecycle Integration', async (t) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';
  await mongoose.connect(mongoUri);

  const app = express();
  app.use(express.json());
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);

  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  t.after(async () => {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  });

  let vendorId;
  let vendorUid;
  let productItem;
  let orderId;
  let customerPhone = '9823011223';

  await t.test('1. Discover nearby Nagpur boutiques', async () => {
    const res = await fetch(`${baseUrl}/api/vendors/nearby?lat=21.1458&lng=79.0882`);
    assert.equal(res.status, 200);
    const vendors = await res.json();
    assert.ok(Array.isArray(vendors));
    assert.ok(vendors.length >= 1, 'Should find at least 1 boutique');
    const anamika = vendors.find((v) => v.shopName.includes('Anamika')) || vendors[0];
    vendorId = anamika._id;
    vendorUid = anamika.firebaseUid;
    assert.ok(vendorId, 'Vendor ID must be present');
  });

  await t.test('2. Load storefront products', async () => {
    const res = await fetch(`${baseUrl}/api/products?limit=20`);
    assert.equal(res.status, 200);
    const data = await res.json();
    const items = data.items || data;
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 1, 'Should find at least 1 active product');
    productItem = items[0];
    assert.ok(productItem.price > 0, 'Product must have valid price');
  });

  await t.test('2b. Vendor adds detailed garment with colors, color chart swatches & rich retail specs', async () => {
    const newGarmentPayload = {
      name: 'Sitabuldi Handloom Zari Kurta',
      brand: 'Studio Anamika',
      category: 'WOMEN',
      subCategory: 'Kurta',
      description: 'Handwoven in Nagpur with pure mulberry silk and antique zari work.',
      price: 5200,
      mrp: 6999,
      sizes: [
        { size: 'S', stock: 4 },
        { size: 'M', stock: 6 },
        { size: 'L', stock: 3 },
      ],
      colors: [
        { name: 'Peacock Teal', hex: '#0F766E' },
        { name: 'Heritage Gold', hex: '#D97706' },
        { name: 'Obsidian Black', hex: '#121215' },
      ],
      material: 'Pure Chanderi Mulberry Silk',
      pattern: 'Handloom Antique Zari',
      fit: 'Tailored Regular',
      occasion: 'Festive & Wedding',
      sleeve: 'Three-Quarter',
      neck: 'Angrakha V-Neck',
      careInstructions: 'Dry Clean Only',
      netQuantity: 1,
      countryOfOrigin: 'India',
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900'],
      isAvailable: true,
    };

    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify(newGarmentPayload),
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.name, 'Sitabuldi Handloom Zari Kurta');
    assert.equal(created.price, 5200);
    assert.equal(created.mrp, 6999);
    assert.equal(created.material, 'Pure Chanderi Mulberry Silk');
    assert.ok(Array.isArray(created.colors));
    assert.equal(created.colors.length, 3);
    assert.equal(created.colors[0].name, 'Peacock Teal');
    assert.equal(created.colors[0].hex, '#0F766E');

    // Verify it is immediately accessible via public product details GET /api/products/:id
    const getRes = await fetch(`${baseUrl}/api/products/${created._id}`);
    assert.equal(getRes.status, 200);
    const fetched = await getRes.json();
    assert.equal(fetched.name, 'Sitabuldi Handloom Zari Kurta');
    assert.equal(fetched.colors[0].name, 'Peacock Teal');
    assert.equal(fetched.fit, 'Tailored Regular');
  });

  await t.test('3. Place guest cart order on 45-min corridor', async () => {
    const payload = {
      vendor: vendorId,
      items: [
        {
          productId: productItem._id,
          name: productItem.name,
          price: productItem.price,
          size: 'M',
          quantity: 1,
        },
      ],
      totalPrice: productItem.price,
      deliveryAddress: {
        line1: 'Flat 301, Palm Court',
        line2: 'Civil Lines',
        area: 'Civil Lines',
        city: 'Nagpur',
        pincode: '440001',
        receiverName: 'Devyani Joshi',
        receiverPhone: customerPhone,
      },
      contact: {
        name: 'Devyani Joshi',
        phone: customerPhone,
      },
      paymentMethod: 'COD',
    };

    const res = await fetch(`${baseUrl}/api/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.ok(created._id);
    assert.equal(created.status, 'PENDING');
    assert.equal(created.totalPrice, productItem.price);
    orderId = created._id;
  });

  await t.test('4. Customer tracks order via live tracking endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/orders/track?orderId=${orderId}&phone=${customerPhone}`);
    assert.equal(res.status, 200);
    const tracked = await res.json();
    assert.equal(tracked._id, orderId);
    assert.equal(tracked.status, 'PENDING');
  });

  await t.test('5. Vendor accepts the order', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });

    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.status, 'ACCEPTED');
  });

  await t.test('6. Vendor marks the order packed', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify({ status: 'PACKED' }),
    });

    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.status, 'PACKED');
  });

  await t.test('7. Vendor marks order ready for pickup (Porter dispatch)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.order.status, 'READY_FOR_PICKUP');
    assert.ok(data.logistics, 'Logistics response must be returned');
  });

  await t.test('8. Order advances to IN_TRANSIT (Rider pickup)', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify({ status: 'IN_TRANSIT' }),
    });

    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.status, 'IN_TRANSIT');
  });

  await t.test('9. Order is DELIVERED at customer doorstep', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });

    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.status, 'DELIVERED');
  });

  await t.test('10. Verify order history timeline is complete and ordered', async () => {
    const finalOrder = await Order.findById(orderId);
    assert.equal(finalOrder.status, 'DELIVERED');
    const statuses = finalOrder.statusHistory.map((h) => h.status);
    assert.ok(statuses.includes('PENDING'));
    assert.ok(statuses.includes('ACCEPTED'));
    assert.ok(statuses.includes('PACKED'));
    assert.ok(statuses.includes('READY_FOR_PICKUP'));
    assert.ok(statuses.includes('IN_TRANSIT'));
    assert.ok(statuses.includes('DELIVERED'));
  });
});
