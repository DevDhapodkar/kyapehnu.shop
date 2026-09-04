import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { PRODUCT_STATUS, PRODUCT_SOURCE } from '../utils/productStatus.js';

export const ensureBootstrapData = async () => {
  try {
    const devEmail = 'dhapodkardev@gmail.com';
    const shopName = 'Dhapodkar Handlooms & Silks';
    const ownerName = 'Dev Dhapodkar';
    const phone = '+91 98765 43210';

    // 1. Ensure Dev Dhapodkar's Vendor profile exists & is APPROVED
    let vendor = await Vendor.findOne({
      $or: [{ email: devEmail.toLowerCase() }, { firebaseUid: 'vendor_dhapodkardev' }],
    });

    if (!vendor) {
      vendor = await Vendor.create({
        firebaseUid: 'vendor_dhapodkardev',
        shopName,
        ownerName,
        email: devEmail.toLowerCase(),
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
      console.log(`[Bootstrap] Created approved vendor: ${shopName} (${devEmail})`);
    } else {
      vendor.approvalStatus = 'APPROVED';
      vendor.isActive = true;
      await vendor.save();
    }

    // 2. Ensure User account exists for Dev Dhapodkar
    let user = await User.findOne({ email: devEmail.toLowerCase() });
    if (!user) {
      await User.create({
        firebaseUid: vendor.firebaseUid,
        name: ownerName,
        email: devEmail.toLowerCase(),
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
      console.log(`[Bootstrap] Created user account for ${devEmail}`);
    }

    // 3. Ensure 2 dummy products for Dhapodkar Handlooms & Silks
    const existingDevProducts = await Product.countDocuments({ vendor: vendor._id });
    if (existingDevProducts === 0) {
      await Product.create([
        {
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
          sizes: [{ size: 'FREE', stock: 15 }],
          images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&auto=format&fit=crop&q=80',
          ],
          highlights: [
            'Pure handloom Chanderi silk with golden zari',
            'Comes with matching unstitched blouse piece',
            'Authentic Nagpur boutique craftsmanship',
          ],
        },
        {
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
        },
      ]);
      console.log('[Bootstrap] Seeded 2 dummy products for Dev Dhapodkar');
    }

    // 4. If storefront has fewer than 4 products total, seed sample Nagpur boutiques
    const totalApproved = await Product.countDocuments({ status: PRODUCT_STATUS.APPROVED });
    if (totalApproved < 4) {
      let boutique = await Vendor.findOne({ shopName: 'Studio Anamika' });
      if (!boutique) {
        boutique = await Vendor.create({
          firebaseUid: 'seed_vendor_anamika',
          shopName: 'Studio Anamika',
          ownerName: 'Anamika Deshmukh',
          phone: '+91 98230 44101',
          whatsappNumber: '+91 98230 44101',
          email: 'anamika@kyapehnu.local',
          address: {
            line1: '14, West High Court Road',
            area: 'Dharampeth',
            city: 'Nagpur',
            pincode: '440010',
          },
          location: {
            type: 'Point',
            coordinates: [79.0610, 21.1420],
          },
          isActive: true,
          approvalStatus: 'APPROVED',
          rating: 4.9,
        });
      }

      await Product.create({
        vendor: boutique._id,
        name: 'Sitabuldi Handloom Zari Kurta',
        description: 'Handwoven in Nagpur with pure mulberry silk and antique zari work.',
        category: 'WOMEN',
        subCategory: 'Kurta',
        price: 5200,
        mrp: 6999,
        brand: 'Studio Anamika',
        material: 'Pure Chanderi Mulberry Silk',
        pattern: 'Handloom Antique Zari',
        fit: 'Tailored Regular',
        sleeve: 'Three-Quarter',
        neck: 'Angrakha V-Neck',
        occasion: 'Festive & Wedding',
        careInstructions: 'Dry Clean Only',
        netQuantity: 1,
        countryOfOrigin: 'India',
        returnPolicy: '7-day return',
        isAvailable: true,
        status: PRODUCT_STATUS.APPROVED,
        source: PRODUCT_SOURCE.APP,
        sku: 'AN-7701',
        colors: [
          { name: 'Peacock Teal', hex: '#0F766E' },
          { name: 'Heritage Gold', hex: '#D97706' },
        ],
        sizes: [
          { size: 'S', stock: 4 },
          { size: 'M', stock: 6 },
        ],
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900'],
      });
      console.log('[Bootstrap] Seeded sample boutique products');
    }
  } catch (error) {
    console.error('[Bootstrap] ensureBootstrapData failed:', error);
  }
};
