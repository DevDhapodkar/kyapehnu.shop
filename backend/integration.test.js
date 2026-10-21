import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';

import connectDB from './config/db.js';
import { ensureBootstrapData } from './config/seedData.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

import vendorRoutes from './routes/vendorRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { generateHmac } from './utils/youpiClient.js';

dotenv.config();

test('E2E Storefront and Order Lifecycle Integration', async (t) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';
  await mongoose.connect(mongoUri);
  await ensureBootstrapData();

  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );
  app.use('/api/vendors', vendorRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);

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

  await t.test('2c. Vendor adds garment with color-specific size inventory variants (Color x Size matrix)', async () => {
    const multiVariantPayload = {
      name: 'Sitabuldi Artisan Boxy Tee',
      brand: 'Studio Anamika',
      category: 'MEN',
      subCategory: 'T-Shirts',
      price: 1499,
      mrp: 1999,
      colors: [
        { name: 'Jet Black', hex: '#141416' },
        { name: 'Sindhoor Crimson', hex: '#9E1929' },
      ],
      variants: [
        {
          color: 'Jet Black',
          colorHex: '#141416',
          sku: 'TEE-BLK-001',
          sizes: [
            { size: 'S', stock: 2 },
            { size: 'M', stock: 5 },
            { size: 'L', stock: 0 },
          ],
        },
        {
          color: 'Sindhoor Crimson',
          colorHex: '#9E1929',
          sku: 'TEE-CRM-001',
          sizes: [
            { size: 'S', stock: 0 },
            { size: 'M', stock: 3 },
            { size: 'L', stock: 4 },
          ],
        },
      ],
      material: '100% Combed Cotton',
      fit: 'Oversized / Boxy',
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900'],
      isAvailable: true,
    };

    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify(multiVariantPayload),
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.name, 'Sitabuldi Artisan Boxy Tee');
    assert.ok(Array.isArray(created.variants));
    assert.equal(created.variants.length, 2);
    assert.equal(created.variants[0].color, 'Jet Black');
    assert.equal(created.variants[0].sizes.length, 3);
    assert.equal(created.variants[1].color, 'Sindhoor Crimson');

    // Auto-aggregated sizes check: S (2+0=2), M (5+3=8), L (0+4=4)
    assert.ok(Array.isArray(created.sizes));
    const sizeM = created.sizes.find((s) => s.size === 'M');
    assert.ok(sizeM);
    assert.equal(sizeM.stock, 8);
    const sizeS = created.sizes.find((s) => s.size === 'S');
    assert.equal(sizeS.stock, 2);
    const sizeL = created.sizes.find((s) => s.size === 'L');
    assert.equal(sizeL.stock, 4);
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

  // Helper: create a product for this seeded vendor via the authed API.
  const createProductForVendor = async (name) => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer dev-token-${vendorUid}`,
      },
      body: JSON.stringify({
        name,
        category: 'WOMEN',
        price: 1999,
        sizes: [{ size: 'M', stock: 3 }],
        colors: [{ name: 'Obsidian Black', hex: '#121215' }],
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900'],
      }),
    });
    assert.equal(res.status, 201);
    return res.json();
  };

  await t.test('11. Vendor deletes an order-free listing', async () => {
    const throwaway = await createProductForVendor('Throwaway Draft Kurti');

    const del = await fetch(`${baseUrl}/api/products/${throwaway._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer dev-token-${vendorUid}` },
    });
    assert.equal(del.status, 200);

    const gone = await fetch(`${baseUrl}/api/products/${throwaway._id}`);
    assert.equal(gone.status, 404, 'deleted product must no longer be fetchable');
  });

  await t.test('12. Deletion is refused for a product with order history', async () => {
    const sellable = await createProductForVendor('Ordered Silk Dupatta');

    const orderRes = await fetch(`${baseUrl}/api/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: vendorId,
        items: [
          {
            productId: sellable._id,
            name: sellable.name,
            price: sellable.price,
            size: 'M',
            quantity: 1,
          },
        ],
        totalPrice: sellable.price,
        deliveryAddress: {
          line1: 'Flat 301, Palm Court',
          area: 'Civil Lines',
          city: 'Nagpur',
          pincode: '440001',
          receiverName: 'Devyani Joshi',
          receiverPhone: customerPhone,
        },
        contact: { name: 'Devyani Joshi', phone: customerPhone },
        paymentMethod: 'COD',
      }),
    });
    assert.equal(orderRes.status, 201);

    const del = await fetch(`${baseUrl}/api/products/${sellable._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer dev-token-${vendorUid}` },
    });
    assert.equal(del.status, 409, 'a product referenced by an order must not be deletable');

    const still = await fetch(`${baseUrl}/api/products/${sellable._id}`);
    assert.equal(still.status, 200, 'the referenced product must survive the refused delete');
  });

  await t.test('13. Deleting an unknown/other product id is rejected', async () => {
    const strangerId = new mongoose.Types.ObjectId().toString();
    const del = await fetch(`${baseUrl}/api/products/${strangerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer dev-token-${vendorUid}` },
    });
    assert.equal(del.status, 404);
  });

  await t.test('14. YouPI-PG: Create payment session returns UPI URI and session data', async () => {
    const res = await fetch(`${baseUrl}/api/payments/youpi/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'KP-TEST-UPI-101',
        amount: 1499,
        customer: { name: 'Devyani Joshi', phone: customerPhone },
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.paymentId);
    assert.ok(data.upiUri.startsWith('upi://pay?'));
    assert.ok(data.upiUri.includes('1499.00'));
  });

  let upiOrderId;
  let upiPaymentId;

  await t.test('15. Place guest order with paymentMethod: UPI and initial status PENDING', async () => {
    const sellable = await createProductForVendor('YouPI Checkout Saree');
    upiPaymentId = `youpi_test_${Date.now()}`;

    const res = await fetch(`${baseUrl}/api/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: vendorId,
        items: [
          {
            productId: sellable._id,
            name: sellable.name,
            price: sellable.price,
            size: 'Free',
            quantity: 1,
          },
        ],
        totalPrice: sellable.price,
        deliveryAddress: {
          line1: 'Near Shankar Nagar Square',
          area: 'Dharampeth',
          city: 'Nagpur',
          pincode: '440010',
          receiverName: 'Devyani Joshi',
          receiverPhone: customerPhone,
        },
        contact: { name: 'Devyani Joshi', phone: customerPhone },
        paymentMethod: 'UPI',
        paymentStatus: 'PENDING',
        paymentId: upiPaymentId,
      }),
    });

    assert.equal(res.status, 201);
    const order = await res.json();
    upiOrderId = order._id;
    assert.equal(order.paymentMethod, 'UPI');
    assert.equal(order.paymentStatus, 'PENDING');
    assert.equal(order.paymentId, upiPaymentId);
  });

  await t.test('16. YouPI Webhook rejects unauthorized requests (missing or invalid HMAC signature)', async () => {
    const webhookPayload = JSON.stringify({
      event: 'SUCCESS',
      paymentId: upiPaymentId,
      orderId: upiOrderId,
      amount: 1999,
      utr: 'UTR998877665544',
    });

    // 1. Without signature
    const noSigRes = await fetch(`${baseUrl}/api/payments/youpi/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: webhookPayload,
    });
    assert.equal(noSigRes.status, 401);

    // 2. With forged signature
    const badSigRes = await fetch(`${baseUrl}/api/payments/youpi/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
      },
      body: webhookPayload,
    });
    assert.equal(badSigRes.status, 401);
  });

  await t.test('17. YouPI Webhook with valid HMAC signature marks order PAID and stamps UTR', async () => {
    const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET || 'kyapehnu_youpi_webhook_secret_nagpur_2026';
    const testUtr = 'UTR847291038472';
    const webhookPayload = JSON.stringify({
      event: 'SUCCESS',
      paymentId: upiPaymentId,
      orderId: upiOrderId,
      amount: 1999,
      utr: testUtr,
    });

    const signature = `sha256=${generateHmac(webhookPayload, webhookSecret)}`;

    const res = await fetch(`${baseUrl}/api/payments/youpi/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Signature': signature,
      },
      body: webhookPayload,
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.received, true);
    assert.equal(data.event, 'SUCCESS');

    // Verify order was marked PAID in the database
    const updatedOrder = await Order.findById(upiOrderId);
    assert.equal(updatedOrder.paymentStatus, 'PAID');
    assert.equal(updatedOrder.paymentMethod, 'UPI');
    assert.equal(updatedOrder.paymentUtr, testUtr);
    assert.ok(updatedOrder.paidAt);
  });

  await t.test('18. YouPI verify endpoint confirms order and payment details', async () => {
    const secondSellable = await createProductForVendor('Verify Test Anarkali');
    const orderRes = await fetch(`${baseUrl}/api/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: vendorId,
        items: [
          {
            productId: secondSellable._id,
            name: secondSellable.name,
            price: secondSellable.price,
            size: 'L',
            quantity: 1,
          },
        ],
        totalPrice: secondSellable.price,
        deliveryAddress: {
          line1: 'Near Law College Square',
          area: 'Civil Lines',
          city: 'Nagpur',
          pincode: '440001',
          receiverName: 'Devyani Joshi',
          receiverPhone: customerPhone,
        },
        contact: { name: 'Devyani Joshi', phone: customerPhone },
        paymentMethod: 'UPI',
        paymentStatus: 'PENDING',
      }),
    });
    assert.equal(orderRes.status, 201);
    const pendingOrder = await orderRes.json();
    assert.equal(pendingOrder.paymentStatus, 'PENDING');

    const verifyRes = await fetch(`${baseUrl}/api/payments/youpi/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: pendingOrder._id,
        paymentId: 'youpi_manual_verify_123',
        utr: 'UTR991122334455',
      }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.success, true);
    assert.equal(verifyData.order.paymentStatus, 'PAID');
    assert.equal(verifyData.order.paymentUtr, 'UTR991122334455');
  });
});

