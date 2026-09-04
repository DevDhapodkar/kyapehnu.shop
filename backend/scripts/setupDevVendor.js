import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = '/Users/devdhapodkar/Desktop/kyapehnu/kyapehnu.claude/backend';

dotenv.config({ path: path.join(backendDir, '.env') });

const Vendor = (await import(path.join(backendDir, 'models/Vendor.js'))).default;
const User = (await import(path.join(backendDir, 'models/User.js'))).default;
const Product = (await import(path.join(backendDir, 'models/Product.js'))).default;
const { PRODUCT_STATUS, PRODUCT_SOURCE } = await import(path.join(backendDir, 'utils/productStatus.js'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';

async function run() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  const email = 'dhapodkardev@gmail.com';
  const shopName = 'Dhapodkar Handlooms & Silks';
  const ownerName = 'Dev Dhapodkar';
  const phone = '+91 98765 43210';

  // 1. Create or update Vendor profile
  let vendor = await Vendor.findOne({
    $or: [{ email: email.toLowerCase() }, { firebaseUid: 'vendor_dhapodkardev' }],
  });

  if (!vendor) {
    vendor = new Vendor({
      firebaseUid: 'vendor_dhapodkardev',
      shopName,
      ownerName,
      email: email.toLowerCase(),
      phone,
      whatsappNumber: phone,
      address: {
        line1: 'Main Market, Variety Square',
        area: 'Sitabuldi',
        city: 'Nagpur',
        pincode: '440012',
      },
      location: {
        type: 'Point',
        coordinates: [79.0833, 21.1466], // Sitabuldi, Nagpur
      },
      operatingHours: [
        { day: 'MON', open: '10:00', close: '21:00', closed: false },
        { day: 'TUE', open: '10:00', close: '21:00', closed: false },
        { day: 'WED', open: '10:00', close: '21:00', closed: false },
        { day: 'THU', open: '10:00', close: '21:00', closed: false },
        { day: 'FRI', open: '10:00', close: '21:00', closed: false },
        { day: 'SAT', open: '10:00', close: '21:00', closed: false },
        { day: 'SUN', open: '11:00', close: '20:00', closed: false },
      ],
      approvalStatus: 'APPROVED',
      isActive: true,
      rating: 4.9,
    });
  } else {
    vendor.shopName = shopName;
    vendor.ownerName = ownerName;
    vendor.phone = phone;
    vendor.whatsappNumber = phone;
    vendor.approvalStatus = 'APPROVED';
    vendor.isActive = true;
  }

  await vendor.save();
  console.log(`✓ Vendor record saved for ${email}:`, {
    id: vendor._id.toString(),
    shopName: vendor.shopName,
    status: vendor.approvalStatus,
  });

  // 2. Also ensure User document exists for this email
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({
      firebaseUid: vendor.firebaseUid,
      name: ownerName,
      email: email.toLowerCase(),
      phone,
      savedAddresses: [
        {
          label: 'Shop',
          line1: 'Main Market, Variety Square',
          city: 'Nagpur',
          pincode: '440012',
          location: { type: 'Point', coordinates: [79.0833, 21.1466] },
        },
      ],
      currentLocation: { type: 'Point', coordinates: [79.0833, 21.1466] },
    });
    await user.save();
    console.log(`✓ User profile created for ${email}:`, user._id.toString());
  }

  // 3. Remove any previous dummy products for this vendor to ensure clean seed
  await Product.deleteMany({ vendor: vendor._id });

  // 4. Create Product 1: Chanderi Silk Saree
  const product1 = await Product.create({
    vendor: vendor._id,
    name: 'Chanderi Silk Banarasi Zari Saree',
    description:
      'Handcrafted authentic Chanderi silk saree with intricate golden zari floral pallu and handcrafted borders. Handpicked and tailored in Sitabuldi, Nagpur.',
    category: 'WOMEN',
    subCategory: 'Saree',
    price: 3499,
    mrp: 5999,
    brand: 'Dhapodkar Silks',
    material: 'Pure Chanderi Silk',
    pattern: 'Zardozi Embroidered',
    fit: 'Regular Fit',
    occasion: 'Festive & Wedding',
    careInstructions: 'Dry Clean Only',
    netQuantity: 1,
    countryOfOrigin: 'India',
    isAvailable: true,
    status: PRODUCT_STATUS.APPROVED,
    source: PRODUCT_SOURCE.APP,
    sku: 'WM-1088',
    colors: [
      { name: 'Rani Pink', hex: '#E11D48' },
      { name: 'Haldi Yellow', hex: '#EAB308' },
      { name: 'Royal Peacock Blue', hex: '#0284C7' },
    ],
    sizes: [
      { size: 'FREE', stock: 15 },
    ],
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Pure handloom Chanderi silk with golden zari',
      'Comes with matching unstitched blouse piece',
      'Authentic Nagpur boutique craftsmanship',
    ],
  });
  console.log(`✓ Created Product 1: "${product1.name}" (SKU: ${product1.sku}, ₹${product1.price}, MRP: ₹${product1.mrp})`);

  // 5. Create Product 2: Royal Angrakha Men Kurta
  const product2 = await Product.create({
    vendor: vendor._id,
    name: 'Royal Angrakha Raw Silk Men Kurta',
    description:
      'Royal festive Angrakha overlapping style men kurta tailored from premium textured raw silk with brass finish ornamental buttons.',
    category: 'MEN',
    subCategory: 'Kurta',
    price: 2499,
    mrp: 3999,
    brand: 'Dhapodkar Silks',
    material: 'Raw Silk',
    pattern: 'Woven Jacquard',
    fit: 'Tailored',
    sleeve: 'Full Sleeves',
    neck: 'Angrakha V-Neck',
    occasion: 'Festive & Wedding',
    careInstructions: 'Dry Clean Only',
    netQuantity: 1,
    countryOfOrigin: 'India',
    isAvailable: true,
    status: PRODUCT_STATUS.APPROVED,
    source: PRODUCT_SOURCE.APP,
    sku: 'MN-2045',
    colors: [
      { name: 'Classic Ivory', hex: '#F9F6F0' },
      { name: 'Terracotta Rust', hex: '#C2410C' },
      { name: 'Forest Emerald', hex: '#047857' },
    ],
    sizes: [
      { size: 'M', stock: 8 },
      { size: 'L', stock: 12 },
      { size: 'XL', stock: 6 },
    ],
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1200&auto=format&fit=crop&q=80',
    ],
    highlights: [
      'Overlapping Angrakha style with traditional ties',
      'Textured raw silk breathable weave',
      'Dry clean recommended for long-lasting sheen',
    ],
  });
  console.log(`✓ Created Product 2: "${product2.name}" (SKU: ${product2.sku}, ₹${product2.price}, MRP: ₹${product2.mrp})`);

  console.log('\nAll done! Vendor and 2 dummy products ready in MongoDB.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
