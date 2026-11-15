process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import Vendor from './models/Vendor.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import WhatsappSession from './models/WhatsappSession.js';
import WhatsappInbound from './models/WhatsappInbound.js';
import {
  normalizePhone,
  isMessageDuplicate,
  recordInboundMessage,
} from './services/whatsappService.js';
import {
  parseSizesInput,
  findVendorByPhone,
  processIncomingMessage,
  getOrCreateSession,
} from './services/whatsappBotEngine.js';
import { ORDER_STATUS } from './utils/orderStatus.js';

dotenv.config();

test('WhatsApp Bot End-to-End Suite', async (t) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';
  await mongoose.connect(mongoUri);

  const testPhone = '919999888877';
  let createdVendorId;
  let createdProductId;
  let createdProductSku;
  let createdOrderId;

  // Cleanup any old test records
  await Vendor.deleteMany({ phone: { $regex: '9999888877' } });
  await WhatsappSession.deleteMany({ phone: testPhone });

  t.after(async () => {
    if (createdVendorId) {
      await Vendor.deleteMany({ _id: createdVendorId });
      await Product.deleteMany({ vendor: createdVendorId });
      await Order.deleteMany({ vendor: createdVendorId });
    }
    await WhatsappSession.deleteMany({ phone: testPhone });
    await mongoose.disconnect();
  });

  await t.test('1. Phone Normalization and Size Parser', () => {
    assert.equal(normalizePhone('+91 98765 43210'), '919876543210');
    assert.equal(normalizePhone('9876543210'), '919876543210');
    assert.equal(normalizePhone('09876543210'), '919876543210');
    assert.equal(normalizePhone('+919876543210'), '919876543210');

    // Size parsing
    const sizes1 = parseSizesInput('S: 5, M: 10, L: 8');
    assert.deepEqual(sizes1, [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 10 },
      { size: 'L', stock: 8 },
    ]);

    const sizes2 = parseSizesInput('15');
    assert.deepEqual(sizes2, [{ size: 'Free', stock: 15 }]);

    const sizes3 = parseSizesInput('M, L');
    assert.deepEqual(sizes3, [
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
    ]);
  });

  await t.test('2. Deduplication via WhatsappInbound', async () => {
    const testMsgId = `wamid_test_${Date.now()}`;
    assert.equal(await isMessageDuplicate(testMsgId), false);
    await recordInboundMessage(testMsgId, testPhone, 'text', { text: 'Hello' });
    assert.equal(await isMessageDuplicate(testMsgId), true);
  });

  await t.test('3. Vendor Verification and Onboarding State Machine', async () => {
    // A. Initial greeting from unknown number -> Prompt to register
    await processIncomingMessage({ from: testPhone, text: 'Hello' });
    let session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'IDLE');

    // B. User replies "1" to register
    await processIncomingMessage({ from: testPhone, text: '1' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ONBOARD_AWAITING_SHOP_NAME');

    // C. Shop name
    await processIncomingMessage({ from: testPhone, text: 'Royal Heritage Handlooms' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ONBOARD_AWAITING_OWNER_NAME');
    assert.equal(session.draft.shopName, 'Royal Heritage Handlooms');

    // D. Owner name
    await processIncomingMessage({ from: testPhone, text: 'Rajesh Agrawal' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ONBOARD_AWAITING_ADDRESS');
    assert.equal(session.draft.ownerName, 'Rajesh Agrawal');

    // E. Address
    await processIncomingMessage({ from: testPhone, text: 'Shop 10, Brigade Road, Bangalore 560001' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ONBOARD_AWAITING_CATEGORY');

    // F. Category selection (e.g. 1 for WOMEN) -> Creates Vendor in DB!
    await processIncomingMessage({ from: testPhone, text: '1' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'IDLE');

    // Verify vendor is saved in DB
    const createdVendor = await findVendorByPhone(testPhone);
    assert.ok(createdVendor);
    assert.equal(createdVendor.shopName, 'Royal Heritage Handlooms');
    assert.equal(createdVendor.ownerName, 'Rajesh Agrawal');
    assert.equal(createdVendor.isActive, true);
    assert.equal(createdVendor.approvalStatus, 'APPROVED');
    assert.equal(session.vendor.toString(), createdVendor._id.toString());

    createdVendorId = createdVendor._id;
  });

  await t.test('4. Add Clothing Item via Chat (Photos & Product Creation with all 12 attributes)', async () => {
    const vendor = await Vendor.findById(createdVendorId);
    assert.ok(vendor);

    // A. Vendor sends photo directly
    await processIncomingMessage({
      from: testPhone,
      text: '',
      media: { id: 'meta_media_test_123' },
    });

    let session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_NAME');
    assert.ok(session.draft.images && session.draft.images.length > 0);

    // 1. Name of garment
    await processIncomingMessage({ from: testPhone, text: 'Chanderi Silk Saree' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_DEPT');
    assert.equal(session.draft.name, 'Chanderi Silk Saree');

    // 2. Department (4 = Ethnic)
    await processIncomingMessage({ from: testPhone, text: '4' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_SUBCATEGORY');
    assert.equal(session.draft.dept, 'ETHNIC');

    // 3. Garment Type / Subcategory (2 = Sarees & Silk Drapes)
    await processIncomingMessage({ from: testPhone, text: '2' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_COLOR');
    assert.equal(session.draft.subCategory, 'Sarees & Silk Drapes');
    assert.equal(session.draft.category, 'WOMEN');

    // 4. Primary Color (8 = Sindhoor Crimson)
    await processIncomingMessage({ from: testPhone, text: '8' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_FIT');
    assert.equal(session.draft.color, 'Sindhoor Crimson');

    // 5. Fit Style (2 = Regular Fit)
    await processIncomingMessage({ from: testPhone, text: '2' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_FABRIC');
    assert.equal(session.draft.fit, 'Regular Fit');

    // 6. Fabric & Material (8 = Pure Silk / Handloom)
    await processIncomingMessage({ from: testPhone, text: '8' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_OCCASION');
    assert.equal(session.draft.fabric, 'Pure Silk / Handloom');

    // 7. Occasion (5 = Festive Wear)
    await processIncomingMessage({ from: testPhone, text: '5' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_CARE');
    assert.equal(session.draft.occasion, 'Festive Wear');

    // 8. Care Instructions (3 = Dry Clean Only)
    await processIncomingMessage({ from: testPhone, text: '3' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_PRICE');
    assert.equal(session.draft.care, 'Dry Clean Only');

    // 9. Selling Price (1499)
    await processIncomingMessage({ from: testPhone, text: '1499' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_MRP');
    assert.equal(session.draft.price, 1499);
    assert.equal(session.draft.suggestedMrp, 1874);

    // 10. Printed MRP (OK -> accepts suggestedMrp 1874)
    await processIncomingMessage({ from: testPhone, text: 'OK' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_SIZES_STOCK');
    assert.equal(session.draft.mrp, 1874);

    // 11. Sizes & Stock (Free: 10)
    await processIncomingMessage({ from: testPhone, text: 'Free: 10' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'ADD_PRODUCT_AWAITING_DESCRIPTION');
    assert.equal(session.draft.totalStock, 10);

    // 12. Description & Highlights (SKIP -> auto generates)
    await processIncomingMessage({ from: testPhone, text: 'SKIP' });
    session = await getOrCreateSession(testPhone);
    assert.equal(session.state, 'IDLE');

    // Verify product was created in MongoDB with all 12 attributes
    const product = await Product.findOne({ vendor: vendor._id, name: 'Chanderi Silk Saree' });
    assert.ok(product);
    assert.equal(product.price, 1499);
    assert.equal(product.mrp, 1874);
    assert.ok(product.sku.startsWith('WM-'));
    assert.equal(product.sizes[0].stock, 10);
    assert.equal(product.subCategory, 'Sarees & Silk Drapes');
    assert.equal(product.colors[0], 'Sindhoor Crimson');
    assert.equal(product.fit, 'Regular Fit');
    assert.equal(product.material, 'Pure Silk / Handloom');
    assert.equal(product.occasion, 'Festive Wear');
    assert.equal(product.careInstructions, 'Dry Clean Only');
    assert.equal(product.isAvailable, true);
    assert.equal(product.source, 'WHATSAPP');
    assert.equal(product.status, 'APPROVED');

    createdProductId = product._id;
    createdProductSku = product.sku;
  });

  await t.test('5. Inventory Management (STOCK & TOGGLE)', async () => {
    const vendor = await Vendor.findById(createdVendorId);
    assert.ok(vendor);

    // A. Update stock with "STOCK <SKU> <QTY>"
    await processIncomingMessage({
      from: testPhone,
      text: `STOCK ${createdProductSku} 25`,
    });

    let updatedProduct = await Product.findById(createdProductId);
    assert.equal(updatedProduct.sizes[0].stock, 25);

    // B. Toggle availability (turns OFF)
    await processIncomingMessage({
      from: testPhone,
      text: `TOGGLE ${createdProductSku}`,
    });

    updatedProduct = await Product.findById(createdProductId);
    assert.equal(updatedProduct.isAvailable, false);

    // C. Turn back ON
    await processIncomingMessage({
      from: testPhone,
      text: `ON ${createdProductSku}`,
    });

    updatedProduct = await Product.findById(createdProductId);
    assert.equal(updatedProduct.isAvailable, true);
  });

  await t.test('6. Order Alert & Mark Ready (Dispatch Driver)', async () => {
    const vendor = await Vendor.findById(createdVendorId);
    const product = await Product.findById(createdProductId);

    // Create a pending test order for this vendor
    const order = await Order.create({
      vendor: vendor._id,
      items: [
        {
          product: product._id,
          name: product.name,
          size: 'Free',
          quantity: 1,
          price: product.price,
        },
      ],
      totalPrice: product.price,
      deliveryAddress: {
        line1: 'Plot 45, Brigade Road',
        locality: 'Central Corridor',
        city: 'Bangalore',
        pincode: '560001',
        location: { type: 'Point', coordinates: [77.607, 12.9719] },
      },
      paymentMethod: 'COD',
      status: ORDER_STATUS.PENDING,
    });

    createdOrderId = order._id;
    const shortOrderId = String(order._id).slice(-6).toUpperCase();

    // Vendor sends "READY <ID>" via WhatsApp
    await processIncomingMessage({
      from: testPhone,
      text: `READY ${shortOrderId}`,
    });

    // Verify order transitioned to READY_FOR_PICKUP or IN_TRANSIT
    const updatedOrder = await Order.findById(order._id);
    assert.ok(
      [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.IN_TRANSIT].includes(updatedOrder.status),
      `Order status should be READY_FOR_PICKUP or IN_TRANSIT, got ${updatedOrder.status}`
    );
  });

  await t.test('7. Store Open / Close Status', async () => {
    // Close store
    await processIncomingMessage({ from: testPhone, text: 'CLOSE' });
    let refreshedVendor = await Vendor.findById(createdVendorId);
    assert.equal(refreshedVendor.isActive, false);

    // Re-open store
    await processIncomingMessage({ from: testPhone, text: 'OPEN' });
    refreshedVendor = await Vendor.findById(createdVendorId);
    assert.equal(refreshedVendor.isActive, true);
  });

  await t.test('8. Vendor Main Menu and Help Commands', async () => {
    await processIncomingMessage({ from: testPhone, text: 'MENU' });
    await processIncomingMessage({ from: testPhone, text: 'HELP' });
    await processIncomingMessage({ from: testPhone, text: 'ORDERS' });
    await processIncomingMessage({ from: testPhone, text: 'STATUS' });
    assert.ok(true);
  });
});
