import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import WhatsappSession from '../models/WhatsappSession.js';
import {
  normalizePhone,
  getPhoneQueryCandidates,
  sendTextMessage,
  sendInteractiveButtons,
  sendInteractiveList,
  downloadAndStoreWhatsAppImage,
} from './whatsappService.js';
import { transitionToReady, adjustStock } from '../controllers/orderController.js';
import { buildUniqueSku } from '../utils/sku.js';
import { PRODUCT_STATUS, PRODUCT_SOURCE } from '../utils/productStatus.js';
import { ORDER_STATUS } from '../utils/orderStatus.js';

const shortId = (id) => String(id).slice(-6).toUpperCase();

export const DEPARTMENTS = [
  { id: 'MEN', label: "Men's Wear", category: 'MEN' },
  { id: 'WOMEN', label: "Women's Wear", category: 'WOMEN' },
  { id: 'UNISEX', label: 'Unisex / Streetwear', category: 'UNISEX' },
  { id: 'ETHNIC', label: 'Ethnic & Festive', category: 'WOMEN' },
  { id: 'KIDS', label: "Kids' Wear", category: 'KIDS' },
];

export const SUBCATEGORIES_BY_DEPT = {
  MEN: [
    'Casual Shirts & Polos',
    'Tees & Hoodies',
    'Denims & Cargos',
    'Jackets & Layering',
    'Co-ords & Tracksets',
    'Kurtas & Festive',
  ],
  WOMEN: [
    'Tops & Graphic Tees',
    'Dresses & Jumpsuits',
    'Co-ord Sets',
    'Shirts & Blouses',
    'Denims & Trousers',
    'Kurtis & Ethnic Sets',
  ],
  UNISEX: [
    'Oversized Tees & Hoodies',
    'Baggy Denims & Cargos',
    'Boxy Streetwear Shirts',
    'Varsity & Bomber Jackets',
    'Streetwear Co-ord Sets',
  ],
  ETHNIC: [
    'Kurtas & Kurta Sets',
    'Sarees & Silk Drapes',
    'Indo-Western Co-ords',
    'Anarkalis & Lehengas',
    'Nehru Jackets & Bandhgalas',
  ],
  KIDS: [
    'Boys Clothing',
    'Girls Clothing',
    'Kids Festive & Ethnic',
    'Daily Casuals',
  ],
};

export const COLOR_OPTIONS = [
  { name: 'Jet Black', hex: '#141416' },
  { name: 'Crisp White', hex: '#FFFFFF' },
  { name: 'Ivory Cream', hex: '#F5F0E6' },
  { name: 'Navy Blue', hex: '#1E293B' },
  { name: 'Olive Green', hex: '#3F4E3A' },
  { name: 'Charcoal Grey', hex: '#374151' },
  { name: 'Beige Khaki', hex: '#D6C5B3' },
  { name: 'Sindhoor Crimson', hex: '#C4243A' },
  { name: 'Powder Blue', hex: '#93C5FD' },
  { name: 'Sage Green', hex: '#84A98C' },
  { name: 'Chocolate Brown', hex: '#4A2C2A' },
  { name: 'Mustard Gold', hex: '#D97706' },
];

export const FIT_OPTIONS = [
  'Relaxed Fit',
  'Regular Fit',
  'Oversized / Boxy',
  'Slim / Tailored',
  'Cropped Fit',
];

export const FABRIC_OPTIONS = [
  '100% Combed Cotton',
  'Heavyweight 240 GSM',
  'Oxford Cotton',
  'Linen Blend',
  'Stretch Denim',
  'Cotton Twill',
  'Rayon / Viscose',
  'Pure Silk / Handloom',
];

export const OCCASION_OPTIONS = [
  'Everyday Casual',
  'Streetwear',
  'Smart / Office',
  'Party & Evening',
  'Festive Wear',
];

export const CARE_OPTIONS = [
  'Machine Wash Cold',
  'Gentle Hand Wash',
  'Dry Clean Only',
];

/**
 * Robust parser for vendor-entered sizes & stock strings.
 * Examples handled:
 *   - Quick Button Presets: "STD_2_EACH", "STOCK_10", "WAIST_2_EACH"
 *   - Conversational Natural Language: "5 each", "2 per size", "10 pcs"
 *   - Clean space-separated (no colons!): "S 4 M 10 L 8", "30 4 32 6"
 *   - Standard colon format: "S: 5, M: 10, L: 8"
 *   - Free size single number: "15" or "Free: 10"
 */
export const parseSizesInput = (input) => {
  if (!input || typeof input !== 'string') return [{ size: 'Free Size', stock: 5 }];
  const cleaned = input.trim();
  const upper = cleaned.toUpperCase();

  // 1. Quick presets from buttons
  if (upper === 'STD_2_EACH' || upper === '2_EACH') {
    return [
      { size: 'S', stock: 2 },
      { size: 'M', stock: 2 },
      { size: 'L', stock: 2 },
      { size: 'XL', stock: 2 },
    ];
  }
  if (upper === 'STD_5_EACH' || upper === '5_EACH') {
    return [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 5 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 5 },
    ];
  }
  if (upper === 'WAIST_2_EACH') {
    return [
      { size: '28', stock: 2 },
      { size: '30', stock: 2 },
      { size: '32', stock: 2 },
      { size: '34', stock: 2 },
      { size: '36', stock: 2 },
    ];
  }
  if (upper === 'WAIST_4_EACH') {
    return [
      { size: '28', stock: 4 },
      { size: '30', stock: 4 },
      { size: '32', stock: 4 },
      { size: '34', stock: 4 },
      { size: '36', stock: 4 },
    ];
  }
  if (upper === 'STOCK_5') return [{ size: 'Free', stock: 5 }];
  if (upper === 'STOCK_10') return [{ size: 'Free', stock: 10 }];
  if (upper === 'STOCK_15') return [{ size: 'Free', stock: 15 }];

  // 2. "5 each" or "2 per size" or "all 3"
  const eachMatch = cleaned.match(/^(\d+)\s*(each|per size|peice|piece|pieces|all)$/i) || cleaned.match(/^(each|all)\s*(\d+)$/i);
  if (eachMatch) {
    const qty = parseInt(eachMatch[1] || eachMatch[2], 10) || 5;
    return [
      { size: 'S', stock: qty },
      { size: 'M', stock: qty },
      { size: 'L', stock: qty },
      { size: 'XL', stock: qty },
    ];
  }

  // 3. Just a number or "Free X" (e.g. "12", "10 pcs", "Free: 10")
  if (/^\d+$/.test(cleaned) || /^free[\s:]*(\d+)?$/i.test(cleaned) || /^(\d+)\s*(pcs?|pieces?|units?)?$/i.test(cleaned)) {
    const numMatch = cleaned.match(/\d+/);
    const qty = numMatch ? parseInt(numMatch[0], 10) : 10;
    return [{ size: 'Free', stock: Math.max(1, qty) }];
  }

  // 4. Multiple sizes extraction using global regex: captures "S: 4, M: 10", "S 4 M 10", "30 4 32 6"
  const pairRegex = /([A-Za-z]+|\d{2,3})\s*[:=\s-]+\s*(\d+)/g;
  const matches = [...cleaned.matchAll(pairRegex)];

  if (matches.length > 0) {
    const results = [];
    for (const m of matches) {
      let rawSize = m[1].trim().toUpperCase();
      if (rawSize === 'SMALL') rawSize = 'S';
      else if (rawSize === 'MEDIUM') rawSize = 'M';
      else if (rawSize === 'LARGE') rawSize = 'L';
      else if (rawSize === 'FREE' || rawSize === 'FREESIZE') rawSize = 'Free';

      const stock = Math.max(0, parseInt(m[2], 10));
      results.push({ size: rawSize, stock });
    }
    if (results.length) return results;
  }

  // 5. Fallback split by comma/semicolon/newline
  const results = [];
  const parts = cleaned.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^([A-Za-z0-9\s]+?)[\s:=]+(\d+)$/);
    if (match) {
      results.push({
        size: match[1].trim().toUpperCase(),
        stock: Math.max(0, parseInt(match[2], 10)),
      });
    } else {
      const pureSize = part.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (pureSize) {
        results.push({ size: pureSize, stock: 5 });
      }
    }
  }

  return results.length ? results : [{ size: 'Free', stock: 5 }];
};

/**
 * Retrieve or create a session record for this WhatsApp phone number.
 */
export const getOrCreateSession = async (rawPhone) => {
  const phone = normalizePhone(rawPhone);
  let session = await WhatsappSession.findOne({ phone });

  if (!session) {
    session = await WhatsappSession.create({ phone, state: 'IDLE', draft: {} });
  }

  return session;
};

/**
 * Find vendor associated with this phone number.
 */
export const findVendorByPhone = async (rawPhone) => {
  const candidates = getPhoneQueryCandidates(rawPhone);
  return Vendor.findOne({ $or: candidates });
};

/**
 * Send the interactive Vendor Operations Main Menu.
 */
export const sendVendorMainMenu = async (to, vendor) => {
  const text =
    `Namaste, *${vendor.shopName}*! 🙏\n` +
    `Welcome to the Kya Pehnu Vendor Operations Hub.\n\n` +
    `*VENDOR OPTIONS:*\n` +
    `1️⃣ *Active Orders* (reply *1* or *ORDERS*)\n` +
    `   View pending orders & dispatch Porter riders.\n\n` +
    `2️⃣ *Add Clothing Item* (reply *2* or *ADD*)\n` +
    `   Send clothing photos & price to list instantly!\n\n` +
    `3️⃣ *Manage Inventory* (reply *3* or *STOCK*)\n` +
    `   View your catalog & update stock quantities.\n\n` +
    `4️⃣ *Boutique Status* (reply *4* or *STATUS*)\n` +
    `   Check today's sales & toggle shop Open/Closed.\n\n` +
    `5️⃣ *Help* (reply *5* or *HELP*)\n\n` +
    `💡 _Tip: You can send a photo of any garment right now to start listing it!_`;

  const buttons = [
    { id: 'ORDERS', title: '📦 Active Orders' },
    { id: 'ADD', title: '🏷️ Add Item' },
    { id: 'STOCK', title: '📊 Inventory' },
  ];

  return sendInteractiveButtons(to, text, buttons);
};

/**
 * Show list of active and pending orders for the vendor.
 */
export const handleListOrders = async (to, vendor) => {
  const orders = await Order.find({
    vendor: vendor._id,
    status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PACKED, ORDER_STATUS.READY_FOR_PICKUP] },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  if (!orders.length) {
    return sendTextMessage(
      to,
      `📦 *No Active Orders*\n\nYou currently have no pending orders. All caught up! 👍\n\nWhen a customer places an order, you will receive an instant WhatsApp alert here with one-tap rider dispatch.`
    );
  }

  let message = `📦 *Active Orders (${orders.length}):*\n───────────────────────\n`;

  orders.forEach((ord, index) => {
    const sId = shortId(ord._id);
    const itemsStr = ord.items.map((i) => `${i.name} (${i.size}) x${i.quantity}`).join(', ');
    const locality = ord.deliveryAddress?.locality || ord.deliveryAddress?.area || ord.deliveryAddress?.city || 'Local Delivery';

    message += `*${index + 1}. Order #${sId}*\n`;
    message += `• Status: *${ord.status}*\n`;
    message += `• Items: ${itemsStr}\n`;
    message += `• Total: ₹${ord.totalPrice} (${ord.paymentMode})\n`;
    message += `• Drop: ${locality}\n`;
    message += `👉 Reply *READY ${sId}* to dispatch driver\n\n`;
  });

  message += `───────────────────────\nReply *READY <ID>* to dispatch Porter, or *MENU* for main menu.`;

  return sendTextMessage(to, message);
};

/**
 * Handle "Mark Ready" command: advances order and dispatches Porter driver.
 */
export const handleMarkOrderReady = async (to, vendor, orderIdentifier) => {
  let order = null;

  if (orderIdentifier) {
    const cleanId = orderIdentifier.trim().toUpperCase();
    if (cleanId.length === 24 && /^[0-9A-Fa-f]{24}$/.test(cleanId)) {
      order = await Order.findOne({ _id: cleanId, vendor: vendor._id });
    } else {
      // Find candidate from recent orders matching short suffix (last 6 chars)
      const recentOrders = await Order.find({ vendor: vendor._id }).sort({ createdAt: -1 }).limit(25);
      order = recentOrders.find((ord) => ord._id.toString().toUpperCase().endsWith(cleanId));
    }
  } else {
    // If no order ID specified, take the oldest pending order
    order = await Order.findOne({
      vendor: vendor._id,
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PACKED] },
    }).sort({ createdAt: 1 });
  }

  if (!order) {
    return sendTextMessage(
      to,
      `⚠️ Could not find an active order matching "${orderIdentifier || 'latest'}".\nType *ORDERS* to view pending orders.`
    );
  }

  if (order.status === ORDER_STATUS.READY_FOR_PICKUP || order.status === ORDER_STATUS.IN_TRANSIT) {
    return sendTextMessage(
      to,
      `ℹ️ Order #${shortId(order._id)} is already ${order.status}. Delivery driver has already been requested!`
    );
  }

  try {
    const logistics = await transitionToReady(order, vendor);
    const sId = shortId(order._id);

    let confirmation =
      `🚚 *Order #${sId} Marked Ready!* 🛵\n` +
      `───────────────────────\n` +
      `A Porter delivery partner has been requested to pick up the package from *${vendor.shopName}*.\n\n` +
      `• *Drop Address:* ${order.deliveryAddress?.line1}, ${order.deliveryAddress?.city || ''}\n` +
      `• *Total Price:* ₹${order.totalPrice} (${order.paymentMode})\n`;

    if (order.porter?.trackingUrl) {
      confirmation += `• *Live Porter Tracking:* ${order.porter.trackingUrl}\n`;
    }
    if (order.porter?.driverName) {
      confirmation += `• *Rider:* ${order.porter.driverName} (${order.porter.driverPhone || ''})\n`;
    }

    confirmation +=
      `\nPlease securely pack the garment(s) and hand them over to the rider when they arrive. Thank you! 🙏\n\nType *MENU* to return to main menu.`;

    return sendTextMessage(to, confirmation);
  } catch (err) {
    console.error('Failed to mark order ready via WhatsApp:', err);
    return sendTextMessage(
      to,
      `❌ Failed to dispatch driver for order #${shortId(order._id)}: ${err.message}. Please try again.`
    );
  }
};

/**
 * Handle listing inventory and stock update instructions.
 */
export const handleListInventory = async (to, vendor) => {
  const products = await Product.find({ vendor: vendor._id }).sort({ updatedAt: -1 }).limit(8);

  if (!products.length) {
    return sendTextMessage(
      to,
      `🏷️ *Your Catalog is Empty*\n\nYou haven't listed any items yet.\n\nTo add your first clothing item right now, simply send a photo of the garment directly in this chat! 📸`
    );
  }

  let message = `📊 *Your Boutique Catalog (${products.length} recent):*\n───────────────────────\n`;

  products.forEach((p, index) => {
    const totalStock = (p.sizes || []).reduce((acc, s) => acc + (s.stock || 0), 0);
    const statusIcon = p.isAvailable && totalStock > 0 ? '✅ In Stock' : '❌ Out of Stock';

    message += `*${index + 1}. ${p.name}* (${p.category})\n`;
    message += `• SKU: \`${p.sku || 'N/A'}\` | Price: ₹${p.price}\n`;
    message += `• Stock: ${totalStock} units | ${statusIcon}\n\n`;
  });

  message +=
    `───────────────────────\n` +
    `*Quick Commands:*\n` +
    `• *STOCK <SKU> <QTY>* → Update stock (e.g. \`STOCK WM-1042 15\`)\n` +
    `• *TOGGLE <SKU>* → Turn item In-Stock / Out-of-Stock\n` +
    `• Send any photo to add a new clothing item!\n` +
    `• Type *MENU* for main menu.`;

  return sendTextMessage(to, message);
};

/**
 * Handle quick stock update command: STOCK <SKU> <QTY>
 */
export const handleQuickStockUpdate = async (to, vendor, skuArg, qtyArg) => {
  if (!skuArg || !qtyArg) {
    return sendTextMessage(to, `⚠️ Format: *STOCK <SKU> <NEW_QTY>*\nExample: \`STOCK WM-1042 15\``);
  }

  const sku = skuArg.trim().toUpperCase();
  const qty = parseInt(qtyArg.trim(), 10);

  if (isNaN(qty) || qty < 0) {
    return sendTextMessage(to, `⚠️ Quantity must be a valid non-negative number.`);
  }

  const product = await Product.findOne({ vendor: vendor._id, sku });
  if (!product) {
    return sendTextMessage(to, `⚠️ Could not find product with SKU "${sku}" in your boutique.`);
  }

  // Update sizes stock
  if (product.sizes && product.sizes.length > 0) {
    product.sizes[0].stock = qty;
  } else {
    product.sizes = [{ size: 'Free', stock: qty }];
  }

  if (qty > 0) {
    product.isAvailable = true;
  }

  await product.save();

  return sendTextMessage(
    to,
    `✅ *Stock Updated Successfully!*\n\n• Item: *${product.name}*\n• SKU: \`${product.sku}\`\n• New Stock: *${qty}* units\n• Status: ${product.isAvailable ? 'In Stock ✅' : 'Out of Stock ❌'}`
  );
};

/**
 * Handle toggling item availability: TOGGLE <SKU> or OFF <SKU> / ON <SKU>
 */
export const handleToggleAvailability = async (to, vendor, skuArg, forceStatus = null) => {
  if (!skuArg) {
    return sendTextMessage(to, `⚠️ Format: *TOGGLE <SKU>*\nExample: \`TOGGLE WM-1042\``);
  }

  const sku = skuArg.trim().toUpperCase();
  const product = await Product.findOne({ vendor: vendor._id, sku });
  if (!product) {
    return sendTextMessage(to, `⚠️ Could not find product with SKU "${sku}".`);
  }

  if (forceStatus !== null) {
    product.isAvailable = forceStatus;
  } else {
    product.isAvailable = !product.isAvailable;
  }

  await product.save();

  return sendTextMessage(
    to,
    `✅ *Item Status Changed!*\n\n• Item: *${product.name}* (\`${product.sku}\`)\n• Availability: ${product.isAvailable ? 'Available / In-Stock 🟢' : 'Unavailable / Out-of-Stock 🔴'}`
  );
};

/**
 * Handle store status and daily summary.
 */
export const handleStoreStatus = async (to, vendor) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders] = await Promise.all([
    Order.find({
      vendor: vendor._id,
      createdAt: { $gte: startOfDay },
    }),
    Order.countDocuments({
      vendor: vendor._id,
      status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PACKED] },
    }),
  ]);

  const todayRevenue = todayOrders
    .filter((o) => o.status !== ORDER_STATUS.CANCELLED)
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const statusMsg =
    `🏪 *Boutique Operations: ${vendor.shopName}*\n` +
    `───────────────────────\n` +
    `• Store Status: ${vendor.isActive ? '*OPEN for delivery orders 🟢*' : '*CLOSED 🔴*'}\n` +
    `• Orders Today: *${todayOrders.length}*\n` +
    `• Today's Sales: *₹${todayRevenue}*\n` +
    `• Pending Orders: *${pendingOrders}*\n` +
    `• Address: ${vendor.address?.line1}, ${vendor.address?.area || vendor.address?.city || ''}\n` +
    `───────────────────────\n` +
    `*Controls:*\n` +
    `• Reply *CLOSE* to temporarily stop receiving orders\n` +
    `• Reply *OPEN* to resume orders\n` +
    `• Reply *MENU* to go back`;

  return sendTextMessage(to, statusMsg);
};

/**
 * Main incoming message processor:
 * - Checks if phone belongs to an existing vendor
 * - Runs onboarding state machine if not registered
 * - Runs vendor operational commands & catalog ingestion if registered
 */
export const processIncomingMessage = async ({ from, text, media, buttonId }) => {
  const session = await getOrCreateSession(from);
  let vendor = await findVendorByPhone(from);

  // If vendor was found, sync session vendor ID
  if (vendor && (!session.vendor || !session.vendor.equals(vendor._id))) {
    session.vendor = vendor._id;
    await session.save();
  }

  const rawInput = (buttonId || text || '').trim();
  const upperInput = rawInput.toUpperCase();

  // Global Cancel / Reset
  if (upperInput === 'CANCEL' || upperInput === 'RESET') {
    session.state = 'IDLE';
    session.draft = {};
    await session.save();

    if (vendor) {
      await sendTextMessage(from, '🔄 Action cancelled. Returning to main menu.');
      return sendVendorMainMenu(from, vendor);
    } else {
      return sendTextMessage(from, '🔄 Action cancelled. Reply *1* to start boutique registration.');
    }
  }

  // ==========================================
  // CASE 1: UNREGISTERED PHONE (ONBOARDING FLOW)
  // ==========================================
  if (!vendor) {
    // Check if user is in an onboarding step
    if (session.state === 'ONBOARD_AWAITING_SHOP_NAME') {
      session.draft = { ...(session.draft || {}), shopName: rawInput };
      session.state = 'ONBOARD_AWAITING_OWNER_NAME';
      session.markModified('draft');
      await session.save();

      return sendTextMessage(
        from,
        `Great! Boutique name recorded as *${rawInput}*.\n\nNow, what is the *Owner's or Manager's Name*? (e.g. *Rajesh Sharma*)`
      );
    }

    if (session.state === 'ONBOARD_AWAITING_OWNER_NAME') {
      session.draft = { ...(session.draft || {}), ownerName: rawInput };
      session.state = 'ONBOARD_AWAITING_ADDRESS';
      session.markModified('draft');
      await session.save();

      return sendTextMessage(
        from,
        `Thank you, *${rawInput}*!\n\nWhat is your *Shop Address*? (Please include shop number, landmark, area, city and pincode - e.g. *Shop 12, Commercial St, Bangalore 560001* or *Shop 4, Linking Rd, Bandra, Mumbai 400050*)`
      );
    }

    if (session.state === 'ONBOARD_AWAITING_ADDRESS') {
      session.draft = { ...(session.draft || {}), address: rawInput };
      session.state = 'ONBOARD_AWAITING_CATEGORY';
      session.markModified('draft');
      await session.save();

      return sendInteractiveList(
        from,
        `Address recorded!\n\nWhat clothing category does your boutique primarily sell? Tap below to choose:`,
        'Select Category',
        [
          {
            title: 'Categories',
            rows: [
              { id: '1', title: "👗 Women's Wear", description: 'Sarees, kurtis, dresses, tops' },
              { id: '2', title: "👔 Men's Wear", description: 'Shirts, tees, trousers, ethnic' },
              { id: '3', title: "🧸 Kids' Wear", description: 'Boys & girls clothing' },
              { id: '4', title: '🛹 Unisex / All', description: 'Streetwear & multi-category' },
            ],
          },
        ]
      );
    }

    if (session.state === 'ONBOARD_AWAITING_CATEGORY') {
      let category = 'WOMEN';
      if (rawInput === '2' || upperInput.includes('MEN')) category = 'MEN';
      else if (rawInput === '3' || upperInput.includes('KID')) category = 'KIDS';
      else if (rawInput === '4' || upperInput.includes('ALL') || upperInput.includes('UNISEX')) category = 'UNISEX';

      const normPhone = normalizePhone(from);
      const last10 = normPhone.slice(-10);

      // Extract pincode (any 6-digit Indian PIN)
      const pincodeMatch = (session.draft.address || '').match(/\b[1-9][0-9]{5}\b/);
      const pincode = pincodeMatch ? pincodeMatch[0] : '400001';

      // Create new Vendor record
      const newVendor = await Vendor.create({
        firebaseUid: `wa_${normPhone}`,
        shopName: session.draft.shopName || 'Fashion Boutique',
        ownerName: session.draft.ownerName || 'Boutique Owner',
        phone: `+91 ${last10}`,
        whatsappNumber: `+91 ${last10}`,
        email: `${normPhone}@kyapehnu.local`,
        address: {
          line1: session.draft.address || 'Main Market',
          area: 'Commercial District',
          city: 'India',
          pincode,
        },
        location: {
          type: 'Point',
          coordinates: [78.9629, 20.5937], // India center
        },
        approvalStatus: 'APPROVED',
        isActive: true,
      });

      session.vendor = newVendor._id;
      session.state = 'IDLE';
      session.draft = {};
      await session.save();

      const welcomeText =
        `🎊 *CONGRATULATIONS!* 🎊\n` +
        `Your boutique *${newVendor.shopName}* is now officially registered on Kya Pehnu!\n\n` +
        `You can now run your entire shop directly through this WhatsApp chat — without ever opening a computer.\n\n` +
        `*What would you like to do first?*`;

      await sendTextMessage(from, welcomeText);
      return sendVendorMainMenu(from, newVendor);
    }

    // If unregistered user replies "1" or "REGISTER"
    if (upperInput === '1' || upperInput === 'REGISTER' || upperInput.includes('JOIN')) {
      session.state = 'ONBOARD_AWAITING_SHOP_NAME';
      session.draft = {};
      await session.save();

      return sendTextMessage(
        from,
        `🏪 *Join Kya Pehnu as a Vendor*\n\nLet's get your boutique online in 60 seconds!\n\nWhat is your *Boutique / Shop Name*? (e.g. *Royal Menswear* or *Maa Ambey Sarees*)`
      );
    }

    if (upperInput === '2' || upperInput.includes('INFO') || upperInput.includes('ABOUT')) {
      return sendInteractiveButtons(
        from,
        `👗 *About Kya Pehnu:*\n\n` +
          `• We connect India's best independent fashion boutiques directly to online shoppers.\n` +
          `• Customers order clothes from curated boutiques and receive them via express delivery (45-60 min hyperlocal & Pan-India express).\n` +
          `• As a vendor, you never need a website or app — you receive orders here on WhatsApp, mark ready, and a driver comes to pick it up!\n\n` +
          `Ready to start selling on Kya Pehnu?`,
        [{ id: '1', title: '🏪 Register Store' }]
      );
    }

    // Default invitation for any other message from unregistered number
    const last10 = normalizePhone(from).slice(-10);
    return sendInteractiveButtons(
      from,
      `👋 *Welcome to Kya Pehnu!* 🛵👗\n\n` +
        `Fast fashion delivery for boutique clothing stores across India.\n\n` +
        `Your number (*+91 ${last10}*) is not registered as a vendor account yet.\n\n` +
        `Would you like to register your boutique and start receiving orders from customers across India?`,
      [
        { id: '1', title: '🏪 Register Boutique' },
        { id: '2', title: 'ℹ️ Learn More' },
      ]
    );
  }

  // ==========================================
  // CASE 2: REGISTERED VENDOR (VENDOR ACTIONS)
  // ==========================================

  // Check if vendor sent an image (clothing photo)
  if (media && media.id) {
    try {
      const storedImageUrl = await downloadAndStoreWhatsAppImage(media.id, vendor._id);

      const images = [...(session.draft?.images || []), storedImageUrl];
      session.draft = { ...(session.draft || {}), images };
      session.markModified('draft');

      // If user wasn't in the middle of naming or pricing, start intake
      if (!session.draft.name) {
        session.state = 'ADD_PRODUCT_AWAITING_NAME';
        await session.save();

        return sendTextMessage(
          from,
          `📸 *Photo Received & Uploaded!* ✅\n\n` +
            `Let's list your garment on Kya Pehnu!\n\n` +
            `🏷️ *Step 1/12 — Product Name / Title*\n` +
            `What is the title of this clothing item?\n` +
            `(e.g. *Jet Black Relaxed Oxford Shirt* or *Embroidered Chanderi Kurti*)`
        );
      } else {
        await session.save();
        return sendTextMessage(
          from,
          `📸 Additional photo attached! (${session.draft.images.length} photos ready).\n\nPlease proceed with answering the current question.`
        );
      }
    } catch (mediaErr) {
      console.error('Media download error:', mediaErr);
      return sendTextMessage(from, `⚠️ Could not process the photo: ${mediaErr.message}. Please try resending.`);
    }
  }

  // Handle multi-step product addition wizard
  if (session.state === 'ADD_PRODUCT_AWAITING_IMAGE') {
    return sendTextMessage(
      from,
      `📸 Please attach and send 1 or more photos of the clothing item from your phone camera or gallery.`
    );
  }

  // Step 1: NAME -> DEPT
  if (session.state === 'ADD_PRODUCT_AWAITING_NAME') {
    session.draft = { ...(session.draft || {}), name: rawInput };
    session.state = 'ADD_PRODUCT_AWAITING_DEPT';
    session.markModified('draft');
    await session.save();

    return sendInteractiveList(
      from,
      `Item Name: *${rawInput}*\n\n👔 *Step 2/12 — Department*\nChoose the department for this item:`,
      'Select Department',
      [
        {
          title: 'Departments',
          rows: [
            { id: '1', title: "👔 Men's Wear", description: 'Polos, tees, denims, jackets' },
            { id: '2', title: "👗 Women's Wear", description: 'Tops, dresses, kurtis, co-ords' },
            { id: '3', title: '🛹 Unisex / Streetwear', description: 'Oversized tees, baggy cargos' },
            { id: '4', title: '🪔 Ethnic & Festive', description: 'Sarees, kurtas, anarkalis' },
            { id: '5', title: "🧸 Kids' Wear", description: 'Boys and girls apparel' },
          ],
        },
      ]
    );
  }

  // Step 2: DEPT -> SUBCATEGORY
  if (session.state === 'ADD_PRODUCT_AWAITING_DEPT') {
    let deptId = 'WOMEN';
    let catEnum = 'WOMEN';

    if (rawInput === '1' || (upperInput.includes('MEN') && !upperInput.includes('WOMEN'))) {
      deptId = 'MEN';
      catEnum = 'MEN';
    } else if (rawInput === '3' || upperInput.includes('UNI') || upperInput.includes('STREET')) {
      deptId = 'UNISEX';
      catEnum = 'UNISEX';
    } else if (rawInput === '4' || upperInput.includes('ETHNIC') || upperInput.includes('FESTIV')) {
      deptId = 'ETHNIC';
      catEnum = 'WOMEN'; // default fallback for ethnic
    } else if (rawInput === '5' || upperInput.includes('KID')) {
      deptId = 'KIDS';
      catEnum = 'KIDS';
    } else {
      deptId = 'WOMEN';
      catEnum = 'WOMEN';
    }

    session.draft = { ...(session.draft || {}), dept: deptId, category: catEnum };
    session.state = 'ADD_PRODUCT_AWAITING_SUBCATEGORY';
    session.markModified('draft');
    await session.save();

    const subcats = SUBCATEGORIES_BY_DEPT[deptId] || SUBCATEGORIES_BY_DEPT.WOMEN;
    const subcatList = subcats.map((s, idx) => `*${idx + 1}.* ${s}`).join('\n');

    return sendTextMessage(
      from,
      `Department set to *${deptId}*.\n\n` +
        `📂 *Step 3/12 — Garment Type / Subcategory*\n` +
        `Select the garment type:\n` +
        `${subcatList}\n\n` +
        `Reply with a number (1 to ${subcats.length}) or type custom style:`
    );
  }

  // Step 3: SUBCATEGORY -> COLOR
  if (session.state === 'ADD_PRODUCT_AWAITING_SUBCATEGORY') {
    const deptId = session.draft.dept || 'WOMEN';
    const subcats = SUBCATEGORIES_BY_DEPT[deptId] || SUBCATEGORIES_BY_DEPT.WOMEN;

    const numIndex = parseInt(rawInput, 10);
    let chosenSubcat = rawInput;

    if (!isNaN(numIndex) && numIndex >= 1 && numIndex <= subcats.length) {
      chosenSubcat = subcats[numIndex - 1];
    }

    // Smart category refinement for ETHNIC
    let catEnum = session.draft.category || 'WOMEN';
    if (deptId === 'ETHNIC') {
      const lower = chosenSubcat.toLowerCase();
      if (lower.includes('sherwani') || lower.includes('nehru') || lower.includes('bandhgala')) {
        catEnum = 'MEN';
      } else if (lower.includes('saree') || lower.includes('lehenga') || lower.includes('anarkali') || lower.includes('kurti')) {
        catEnum = 'WOMEN';
      } else {
        catEnum = 'UNISEX';
      }
    }

    session.draft = {
      ...(session.draft || {}),
      subCategory: chosenSubcat,
      category: catEnum,
    };
    session.state = 'ADD_PRODUCT_AWAITING_COLOR';
    session.markModified('draft');
    await session.save();

    const colorList = COLOR_OPTIONS.map((c, idx) => `*${idx + 1}.* ${c.name}`).join('\n');

    return sendTextMessage(
      from,
      `Garment Type: *${chosenSubcat}*\n\n` +
        `🎨 *Step 4/12 — Primary Color*\n` +
        `Select the primary color:\n` +
        `${colorList}\n\n` +
        `Reply with 1 to 12 (or type custom color name like *Wine Red, Emerald, Lilac*):`
    );
  }

  // Step 4: COLOR -> FIT
  if (session.state === 'ADD_PRODUCT_AWAITING_COLOR') {
    const numIndex = parseInt(rawInput, 10);
    let chosenColor = rawInput;
    let chosenHex = '#141416';

    if (!isNaN(numIndex) && numIndex >= 1 && numIndex <= COLOR_OPTIONS.length) {
      chosenColor = COLOR_OPTIONS[numIndex - 1].name;
      chosenHex = COLOR_OPTIONS[numIndex - 1].hex;
    }

    session.draft = {
      ...(session.draft || {}),
      color: chosenColor,
      colorHex: chosenHex,
    };
    session.state = 'ADD_PRODUCT_AWAITING_FIT';
    session.markModified('draft');
    await session.save();

    const fitList = FIT_OPTIONS.map((f, idx) => `*${idx + 1}.* ${f}`).join('\n');

    return sendTextMessage(
      from,
      `Color: *${chosenColor}*\n\n` +
        `📐 *Step 5/12 — Fit Style*\n` +
        `Select the fit style:\n` +
        `${fitList}\n\n` +
        `Reply with 1 to 5 (or type custom fit):`
    );
  }

  // Step 5: FIT -> FABRIC
  if (session.state === 'ADD_PRODUCT_AWAITING_FIT') {
    const numIndex = parseInt(rawInput, 10);
    let chosenFit = rawInput;

    if (!isNaN(numIndex) && numIndex >= 1 && numIndex <= FIT_OPTIONS.length) {
      chosenFit = FIT_OPTIONS[numIndex - 1];
    }

    session.draft = { ...(session.draft || {}), fit: chosenFit };
    session.state = 'ADD_PRODUCT_AWAITING_FABRIC';
    session.markModified('draft');
    await session.save();

    const fabricList = FABRIC_OPTIONS.map((f, idx) => `*${idx + 1}.* ${f}`).join('\n');

    return sendTextMessage(
      from,
      `Fit Style: *${chosenFit}*\n\n` +
        `🧵 *Step 6/12 — Fabric & Material*\n` +
        `Select the fabric / material:\n` +
        `${fabricList}\n\n` +
        `Reply with 1 to 8 (or type custom fabric composition):`
    );
  }

  // Step 6: FABRIC -> OCCASION
  if (session.state === 'ADD_PRODUCT_AWAITING_FABRIC') {
    const numIndex = parseInt(rawInput, 10);
    let chosenFabric = rawInput;

    if (!isNaN(numIndex) && numIndex >= 1 && numIndex <= FABRIC_OPTIONS.length) {
      chosenFabric = FABRIC_OPTIONS[numIndex - 1];
    }

    session.draft = { ...(session.draft || {}), fabric: chosenFabric };
    session.state = 'ADD_PRODUCT_AWAITING_OCCASION';
    session.markModified('draft');
    await session.save();

    const occasionList = OCCASION_OPTIONS.map((o, idx) => `*${idx + 1}.* ${o}`).join('\n');

    return sendInteractiveButtons(
      from,
      `Fabric: *${chosenFabric}*\n\n` +
        `✨ *Step 7/12 — Occasions*\n` +
        `Which occasion(s) is this garment suitable for?\n` +
        `1. ☀️ Everyday Casual\n` +
        `2. 🛹 Streetwear\n` +
        `3. 💼 Smart / Office\n` +
        `4. 🥂 Party & Evening\n` +
        `5. 🪔 Festive & Wedding\n\n` +
        `👉 Tap a combo below, or reply with multiple numbers (e.g. *1, 4* or *4, 5* or *All*):`,
      [
        { id: 'OCC_FESTIVE_PARTY', title: '🪔 Festive & Party' },
        { id: 'OCC_CASUAL_DAILY', title: '☀️ Everyday Casual' },
        { id: 'OCC_ALL', title: '🌟 All Occasions' },
      ]
    );
  }

  // Step 7: OCCASION -> CARE (Supports Multiple Occasions!)
  if (session.state === 'ADD_PRODUCT_AWAITING_OCCASION') {
    let chosenOccasions = [];

    // Check button IDs
    if (upperInput === 'OCC_FESTIVE_PARTY') {
      chosenOccasions = ['Festive Wear', 'Party & Evening'];
    } else if (upperInput === 'OCC_CASUAL_DAILY') {
      chosenOccasions = ['Everyday Casual', 'Streetwear'];
    } else if (upperInput === 'OCC_ALL' || upperInput === 'ALL') {
      chosenOccasions = ['Everyday Casual', 'Party & Evening', 'Festive Wear'];
    } else {
      // Check if user replied with comma, slash, space, or ampersand separated numbers, e.g. "1, 4", "4, 5", "1 5", "4 & 5"
      const digits = rawInput.match(/\b[1-5]\b/g);
      if (digits && digits.length > 0) {
        const uniqueDigits = [...new Set(digits)];
        chosenOccasions = uniqueDigits.map((d) => OCCASION_OPTIONS[parseInt(d, 10) - 1]).filter(Boolean);
      } else {
        // Check for keyword matches in text (e.g. "festive and party", "casual and wedding")
        const lower = rawInput.toLowerCase();
        for (const occ of OCCASION_OPTIONS) {
          const occLower = occ.toLowerCase();
          const firstWord = occLower.split(' ')[0];
          if (lower.includes(firstWord)) {
            chosenOccasions.push(occ);
          }
        }
        // If still empty, use rawInput as custom occasion
        if (!chosenOccasions.length) {
          chosenOccasions = [rawInput];
        }
      }
    }

    const occasionStr = chosenOccasions.join(', ');

    session.draft = { ...(session.draft || {}), occasion: occasionStr };
    session.state = 'ADD_PRODUCT_AWAITING_CARE';
    session.markModified('draft');
    await session.save();

    return sendInteractiveButtons(
      from,
      `Occasion: *${occasionStr}*\n\n🧺 *Step 8/12 — Care Instructions*\nSelect the washing / care instructions:`,
      [
        { id: '1', title: 'Machine Wash Cold' },
        { id: '2', title: 'Gentle Hand Wash' },
        { id: '3', title: 'Dry Clean Only' },
      ]
    );
  }

  // Step 8: CARE -> PRICE
  if (session.state === 'ADD_PRODUCT_AWAITING_CARE') {
    const numIndex = parseInt(rawInput, 10);
    let chosenCare = rawInput;

    if (!isNaN(numIndex) && numIndex >= 1 && numIndex <= CARE_OPTIONS.length) {
      chosenCare = CARE_OPTIONS[numIndex - 1];
    }

    session.draft = { ...(session.draft || {}), care: chosenCare };
    session.state = 'ADD_PRODUCT_AWAITING_PRICE';
    session.markModified('draft');
    await session.save();

    return sendTextMessage(
      from,
      `Care: *${chosenCare}*\n\n` +
        `💰 *Step 9/12 — Selling Price*\n` +
        `What is the customer selling price in ₹?\n` +
        `(e.g. *899* or *1299*)`
    );
  }

  // Step 9: PRICE -> MRP
  if (session.state === 'ADD_PRODUCT_AWAITING_PRICE') {
    const price = parseInt(rawInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(price) || price <= 0) {
      return sendTextMessage(from, `⚠️ Please enter a valid selling price in numbers (e.g. *899* or *1299*).`);
    }

    const suggestedMrp = Math.round(price * 1.25); // Standard 25% printed tag markup

    session.draft = {
      ...(session.draft || {}),
      price,
      suggestedMrp,
    };
    session.state = 'ADD_PRODUCT_AWAITING_MRP';
    session.markModified('draft');
    await session.save();

    return sendInteractiveButtons(
      from,
      `Selling Price: *₹${price}*\n\n` +
        `🏷️ *Step 10/12 — Printed MRP on Tag*\n` +
        `Calculated standard 25% markup: *₹${suggestedMrp}*.\n\n` +
        `Tap below to keep ₹${suggestedMrp}, or type a custom MRP in ₹:`,
      [{ id: 'OK', title: `Keep ₹${suggestedMrp}` }]
    );
  }

  // Step 10: MRP -> SIZES & STOCK
  if (session.state === 'ADD_PRODUCT_AWAITING_MRP') {
    let finalMrp = session.draft.suggestedMrp || Math.round((session.draft.price || 999) * 1.25);

    if (upperInput !== 'OK' && upperInput !== '1' && upperInput !== 'YES' && upperInput !== 'DEFAULT') {
      const parsedCustom = parseInt(rawInput.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedCustom) && parsedCustom >= (session.draft.price || 0)) {
        finalMrp = parsedCustom;
      }
    }

    session.draft = { ...(session.draft || {}), mrp: finalMrp };
    session.state = 'ADD_PRODUCT_AWAITING_SIZES_STOCK';
    session.markModified('draft');
    await session.save();

    return sendInteractiveButtons(
      from,
      `Printed MRP: *₹${finalMrp}*\n\n` +
        `📦 *Step 11/12 — Sizes & Stock*\n` +
        `How is this item sized? Tap a quick option below:`,
      [
        { id: 'SIZE_FREE', title: '✨ Free Size' },
        { id: 'SIZE_STD', title: '👕 S, M, L, XL' },
        { id: 'SIZE_WAIST', title: '👖 Waist (28, 30...)' },
      ]
    );
  }

  // Step 11: SIZES & STOCK -> DESCRIPTION
  if (session.state === 'ADD_PRODUCT_AWAITING_SIZES_STOCK') {
    // A. If vendor tapped Free Size button
    if (upperInput === 'SIZE_FREE') {
      return sendInteractiveButtons(
        from,
        `✨ *Free Size / One Size*\n\nHow many total pieces do you have in stock?\nTap an option or reply with any number:`,
        [
          { id: 'STOCK_5', title: '5 pieces' },
          { id: 'STOCK_10', title: '10 pieces' },
          { id: 'STOCK_15', title: '15 pieces' },
        ]
      );
    }

    // B. If vendor tapped Standard S, M, L, XL button
    if (upperInput === 'SIZE_STD') {
      return sendInteractiveButtons(
        from,
        `👕 *Standard Sizing (S, M, L, XL)*\n\n` +
          `How is your stock distributed?\n` +
          `• Tap a quick preset below\n` +
          `• Or type counts (e.g. *M 4, L 6* or *5 each* — no colons needed!):`,
        [
          { id: 'STD_2_EACH', title: '2 of each (8 pcs)' },
          { id: 'STD_5_EACH', title: '5 of each (20 pcs)' },
          { id: 'STD_CUSTOM', title: 'Custom quantities' },
        ]
      );
    }

    // C. If vendor tapped Waist sizing button
    if (upperInput === 'SIZE_WAIST') {
      return sendInteractiveButtons(
        from,
        `👖 *Waist Sizing (28, 30, 32, 34, 36)*\n\n` +
          `How is your stock distributed?\n` +
          `• Tap a quick preset below\n` +
          `• Or type sizes and counts (e.g. *30 4, 32 4, 34 2* or *2 each*):`,
        [
          { id: 'WAIST_2_EACH', title: '2 of each (10 pcs)' },
          { id: 'WAIST_4_EACH', title: '4 of each (20 pcs)' },
          { id: 'WAIST_CUSTOM', title: 'Custom quantities' },
        ]
      );
    }

    // D. If vendor tapped "Custom quantities"
    if (upperInput === 'STD_CUSTOM' || upperInput === 'WAIST_CUSTOM') {
      return sendTextMessage(
        from,
        `✍️ Please reply with your sizes and counts (no colons needed):\n\n` +
          `Examples:\n` +
          `👉 *M 4, L 6*\n` +
          `👉 *S 2, M 5, L 5, XL 2*\n` +
          `👉 *30 4, 32 4, 34 2*\n` +
          `👉 *5 each*`
      );
    }

    // E. Parse input (handles buttons like STOCK_10, STD_5_EACH, or typed inputs like "S: 4, M: 10", "10", "5 each", "M 4 L 6", etc.)
    const parsedSizes = parseSizesInput(rawInput);
    const totalStock = parsedSizes.reduce((acc, s) => acc + s.stock, 0);

    session.draft = {
      ...(session.draft || {}),
      sizes: parsedSizes,
      totalStock,
    };
    session.state = 'ADD_PRODUCT_AWAITING_DESCRIPTION';
    session.markModified('draft');
    await session.save();

    const sizesSummary = parsedSizes.map((s) => `${s.size}:${s.stock}`).join(', ');

    return sendInteractiveButtons(
      from,
      `Stock Recorded: *${totalStock} units* (${sizesSummary})\n\n` +
        `📝 *Step 12/12 — Product Description & Styling Notes*\n` +
        `Tap below to auto-generate luxury retail highlights, or reply with your custom text:`,
      [{ id: 'SKIP', title: '✨ Auto-Generate' }]
    );
  }

  // Step 12: DESCRIPTION -> SAVE TO DB (LIVE ON STOREFRONT)
  if (session.state === 'ADD_PRODUCT_AWAITING_DESCRIPTION') {
    let finalDesc = '';
    if (upperInput === 'SKIP' || upperInput === 'DEFAULT' || upperInput === 'NONE' || !rawInput) {
      finalDesc = `${session.draft.fit || 'Regular Fit'} · ${session.draft.fabric || 'Cotton'} · ${session.draft.color || 'Classic'} · ${session.draft.occasion || 'Casual'} · ${session.draft.care || 'Machine Wash'}`;
    } else {
      finalDesc = rawInput;
    }

    const category = session.draft.category || 'WOMEN';
    const uniqueSku = await buildUniqueSku(category, (sku) => Product.exists({ sku }).then(Boolean));

    const colorName = session.draft.color || 'Jet Black';
    const colorHex = session.draft.colorHex || '#141416';
    const colorSkuSuffix = colorName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();

    const variants = [
      {
        color: colorName,
        colorHex,
        sizes: session.draft.sizes,
        sku: `${uniqueSku}-${colorSkuSuffix}`,
      },
    ];

    const images = session.draft.images?.length
      ? session.draft.images
      : ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'];

    const newProduct = await Product.create({
      vendor: vendor._id,
      name: session.draft.name || 'Boutique Garment',
      category,
      subCategory: session.draft.subCategory || 'Casual Wear',
      colors: [colorName],
      variants,
      fit: session.draft.fit || 'Regular Fit',
      material: session.draft.fabric || '100% Combed Cotton',
      occasion: session.draft.occasion || 'Everyday Casual',
      careInstructions: session.draft.care || 'Machine Wash Cold',
      price: session.draft.price || 799,
      mrp: session.draft.mrp || Math.round((session.draft.price || 799) * 1.25),
      sizes: session.draft.sizes,
      images,
      description: finalDesc,
      sku: uniqueSku,
      status: PRODUCT_STATUS.APPROVED,
      source: PRODUCT_SOURCE.WHATSAPP,
      isAvailable: true,
    });

    const totalStock = (session.draft.sizes || []).reduce((acc, s) => acc + s.stock, 0);
    const sizesStr = (session.draft.sizes || []).map((s) => `${s.size}:${s.stock}`).join(', ');

    session.state = 'IDLE';
    session.draft = {};
    await session.save();

    const successMsg =
      `🎉 *GARMENT LISTED LIVE ON KYA PEHNU!* 👗✨\n` +
      `───────────────────────\n` +
      `• *Item:* ${newProduct.name}\n` +
      `• *SKU:* \`${newProduct.sku}\`\n` +
      `• *Department:* ${newProduct.category}\n` +
      `• *Garment Type:* ${newProduct.subCategory}\n` +
      `• *Color:* ${colorName}\n` +
      `• *Fit & Fabric:* ${newProduct.fit} · ${newProduct.material}\n` +
      `• *Occasion & Care:* ${newProduct.occasion} · ${newProduct.careInstructions}\n` +
      `• *Selling Price:* ₹${newProduct.price} (MRP: ₹${newProduct.mrp})\n` +
      `• *Total Stock:* ${totalStock} units (${sizesStr})\n` +
      `• *Highlights:* ${newProduct.description}\n` +
      `───────────────────────\n` +
      `This piece is now **LIVE** and orderable by customers nationwide on Kya Pehnu! 🚀\n\n` +
      `Reply *MENU* to view options or send another photo to list another garment.`;

    return sendTextMessage(from, successMsg);
  }

  // ==========================================
  // DISPATCH & INVENTORY COMMAND ROUTING
  // ==========================================

  // Check for "READY <id>" or "READY"
  if (upperInput.startsWith('READY')) {
    const orderArg = upperInput.replace('READY', '').replace(/[^A-Za-z0-9]/g, '').trim();
    return handleMarkOrderReady(from, vendor, orderArg);
  }

  // Check for "STOCK <SKU> <QTY>"
  if (upperInput.startsWith('STOCK') && upperInput.split(/\s+/).length >= 3) {
    const parts = upperInput.split(/\s+/);
    return handleQuickStockUpdate(from, vendor, parts[1], parts[2]);
  }

  // Check for "TOGGLE <SKU>"
  if (upperInput.startsWith('TOGGLE')) {
    const sku = upperInput.replace('TOGGLE', '').trim();
    return handleToggleAvailability(from, vendor, sku);
  }
  if (upperInput.startsWith('OFF')) {
    const sku = upperInput.replace('OFF', '').trim();
    return handleToggleAvailability(from, vendor, sku, false);
  }
  if (upperInput.startsWith('ON')) {
    const sku = upperInput.replace('ON', '').trim();
    return handleToggleAvailability(from, vendor, sku, true);
  }

  // Check for "OPEN" or "CLOSE" store commands
  if (upperInput === 'OPEN') {
    vendor.isActive = true;
    await vendor.save();
    return sendTextMessage(from, `🟢 *Boutique is now OPEN!*\nYou are ready to receive delivery orders on Kya Pehnu.`);
  }
  if (upperInput === 'CLOSE') {
    vendor.isActive = false;
    await vendor.save();
    return sendTextMessage(from, `🔴 *Boutique is now CLOSED!*\nNew orders will be paused until you reply *OPEN*.`);
  }

  // Main Menu / Help Commands
  if (
    upperInput === 'MENU' ||
    upperInput === 'HI' ||
    upperInput === 'HELLO' ||
    upperInput === 'START' ||
    upperInput === 'NAMASTE'
  ) {
    return sendVendorMainMenu(from, vendor);
  }

  if (upperInput === '1' || upperInput === 'ORDERS' || upperInput === 'ACTIVE') {
    return handleListOrders(from, vendor);
  }

  if (upperInput === '2' || upperInput === 'ADD' || upperInput === 'NEW') {
    session.state = 'ADD_PRODUCT_AWAITING_IMAGE';
    session.draft = {};
    await session.save();

    return sendTextMessage(
      from,
      `🏷️ *Add New Clothing Item*\n\nPlease *send 1 or more photos* of the garment directly here in WhatsApp. 📸`
    );
  }

  if (upperInput === '3' || upperInput === 'STOCK' || upperInput === 'INVENTORY') {
    return handleListInventory(from, vendor);
  }

  if (upperInput === '4' || upperInput === 'STATUS' || upperInput === 'TODAY') {
    return handleStoreStatus(from, vendor);
  }

  if (upperInput === '5' || upperInput === 'HELP') {
    const helpMsg =
      `📖 *Kya Pehnu WhatsApp Commands:*\n` +
      `───────────────────────\n` +
      `• *ORDERS* or *1* → List pending & active orders\n` +
      `• *READY <ORDER_ID>* → Mark ready & dispatch Porter rider\n` +
      `• *ADD* or *2* → List new item (or just send photos!)\n` +
      `• *STOCK* or *3* → View inventory\n` +
      `• *STOCK <SKU> <QTY>* → Quick update stock (e.g. \`STOCK WM-1042 20\`)\n` +
      `• *TOGGLE <SKU>* → Mark In-Stock or Out-of-Stock\n` +
      `• *STATUS* or *4* → Check daily sales & revenue\n` +
      `• *OPEN* / *CLOSE* → Open or close store for orders\n` +
      `• *MENU* → Open main menu\n` +
      `• *CANCEL* → Cancel current action`;

    return sendTextMessage(from, helpMsg);
  }

  // Fallback for unparsed message
  return sendTextMessage(
    from,
    `🤔 I didn't recognize that command.\n\nReply with a number:\n*1* - 📦 Active Orders\n*2* - 🏷️ Add Item (or send photo)\n*3* - 📊 Inventory & Stock\n*4* - 🏪 Store Status\n*MENU* - Main Menu`
  );
};
