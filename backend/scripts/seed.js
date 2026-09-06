import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from '../models/Vendor.js';
import Product from '../models/Product.js';
import { PRODUCT_STATUS } from '../utils/productStatus.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu';

// Real, reachable product imagery (Cloudinary sample.webp was a 404 placeholder).
// Swap these for owned Cloudinary uploads once real catalogue photos exist.
const IMG = {
  angrakha: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
  coord: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8',
  tussarKurta: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
  saree: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
  anarkali: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0',
};

async function seed() {
  try {
    console.log('Connecting to MongoDB at', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Ensure 2dsphere index on Vendor
    await Vendor.init();
    await Product.init();

    console.log('Clearing existing seed data...');
    // Only remove previously seeded records or clear for fresh slate
    const vendors = [
      {
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
      },
      {
        firebaseUid: 'seed_vendor_maheshwari',
        shopName: 'Maheshwari Handlooms',
        ownerName: 'Sunil Maheshwari',
        phone: '+91 98230 44102',
        whatsappNumber: '+91 98230 44102',
        email: 'maheshwari@kyapehnu.local',
        address: {
          line1: '88, Cloth Market',
          area: 'Gandhibagh',
          city: 'Nagpur',
          pincode: '440002',
        },
        location: {
          type: 'Point',
          coordinates: [79.1020, 21.1510],
        },
        isActive: true,
        approvalStatus: 'APPROVED',
        rating: 4.8,
      },
      {
        firebaseUid: 'seed_vendor_kalaniketan',
        shopName: 'Kala Niketan',
        ownerName: 'Pooja Agarwal',
        phone: '+91 98230 44103',
        whatsappNumber: '+91 98230 44103',
        email: 'kalaniketan@kyapehnu.local',
        address: {
          line1: '52, Main Road',
          area: 'Sitabuldi',
          city: 'Nagpur',
          pincode: '440012',
        },
        location: {
          type: 'Point',
          coordinates: [79.0882, 21.1458],
        },
        isActive: true,
        approvalStatus: 'APPROVED',
        rating: 4.95,
      },
    ];

    const savedVendors = [];
    for (const v of vendors) {
      const saved = await Vendor.findOneAndUpdate(
        { firebaseUid: v.firebaseUid },
        v,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedVendors.push(saved);
      console.log(`Synced vendor: ${saved.shopName} (${saved._id})`);
    }

    const products = [
      {
        vendor: savedVendors[0]._id,
        name: 'Handwoven Chanderi Angrakha',
        description: 'Pure handwoven Chanderi cotton-silk silhouette with delicate dabka and zardozi threadwork along the asymmetrical neckline.',
        category: 'WOMEN',
        subCategory: 'Angrakha Kurta',
        price: 4800,
        mrp: 6200,
        brand: 'Studio Anamika',
        material: 'Chanderi Silk',
        pattern: 'Dabka & Zardozi Threadwork',
        fit: 'Regular Flared',
        occasion: 'Festive & Evening Soirée',
        sleeve: 'Full Sleeves',
        neck: 'Angrakha Overlap V-Neck',
        careInstructions: 'Dry Clean Only',
        netQuantity: 1,
        countryOfOrigin: 'India',
        colors: [
          { name: 'Obsidian Black', hex: '#121215' },
          { name: 'Heritage Gold', hex: '#D97706' },
          { name: 'Peacock Teal', hex: '#0F766E' },
        ],
        isAvailable: true,
        status: PRODUCT_STATUS.APPROVED,
        sizes: [
          { size: 'S', stock: 4 },
          { size: 'M', stock: 6 },
          { size: 'L', stock: 3 },
        ],
        images: [IMG.angrakha],
      },
      {
        vendor: savedVendors[0]._id,
        name: 'Sculpted Linen Co-ord Set',
        description: 'Tailored notched lapel vest paired with pleated linen trousers. Breathable for Vidarbha summers.',
        category: 'WOMEN',
        subCategory: 'Co-ord Set',
        price: 2890,
        mrp: 3600,
        brand: 'Studio Anamika',
        material: '100% Belgian Linen',
        pattern: 'Solid Tailored',
        fit: 'Tailored Relaxed',
        occasion: 'Casual Daywear',
        sleeve: 'Sleeveless Vest',
        neck: 'Notched Lapel Collar',
        careInstructions: 'Gentle Machine Wash',
        netQuantity: 2,
        countryOfOrigin: 'India',
        colors: [
          { name: 'Pearl Ivory', hex: '#F9F6F0' },
          { name: 'Mint Sage', hex: '#10B981' },
          { name: 'Terracotta Rust', hex: '#C2410C' },
        ],
        isAvailable: true,
        status: PRODUCT_STATUS.APPROVED,
        sizes: [
          { size: 'XS', stock: 2 },
          { size: 'S', stock: 5 },
          { size: 'M', stock: 4 },
        ],
        images: [IMG.coord],
      },
      {
        vendor: savedVendors[1]._id,
        name: 'Tussar Silk Kurta',
        description: 'Raw tussar silk classic straight-cut tunic with subtle kantha topstitching on the placket.',
        category: 'WOMEN',
        subCategory: 'Straight Kurta',
        price: 3450,
        mrp: 4200,
        brand: 'Maheshwari Handlooms',
        material: 'Raw Tussar Silk',
        pattern: 'Kantha Topstitch Weave',
        fit: 'Straight Regular',
        occasion: 'Festive & Office',
        sleeve: 'Three-Quarter',
        neck: 'Mandarin Bandhgala',
        careInstructions: 'Dry Clean Only',
        netQuantity: 1,
        countryOfOrigin: 'India',
        colors: [
          { name: 'Amber Ochre', hex: '#F59E0B' },
          { name: 'Royal Maroon', hex: '#721B24' },
          { name: 'Midnight Navy', hex: '#1E293B' },
        ],
        isAvailable: true,
        status: PRODUCT_STATUS.APPROVED,
        sizes: [
          { size: 'M', stock: 5 },
          { size: 'L', stock: 7 },
          { size: 'XL', stock: 2 },
        ],
        images: [IMG.tussarKurta],
      },
      {
        vendor: savedVendors[1]._id,
        name: 'Tissue Silk Draped Saree',
        description: 'Handwoven golden tissue silk saree with a woven zari border and matching running unstitched blouse piece.',
        category: 'WOMEN',
        subCategory: 'Festive Saree',
        price: 6200,
        mrp: 8500,
        brand: 'Maheshwari Handlooms',
        material: 'Tissue Zari Silk',
        pattern: 'Woven Jacquard Zari',
        fit: 'Standard 6.2m Draped',
        occasion: 'Wedding & Ceremonial',
        sleeve: 'Unstitched Blouse Piece',
        neck: 'Bespoke Neckline',
        careInstructions: 'Dry Clean Only',
        netQuantity: 1,
        countryOfOrigin: 'India',
        colors: [
          { name: 'Heritage Gold', hex: '#D97706' },
          { name: 'Crimson Red', hex: '#C4243A' },
          { name: 'Emerald Green', hex: '#047857' },
        ],
        isAvailable: true,
        status: PRODUCT_STATUS.APPROVED,
        sizes: [
          { size: 'FREE', stock: 4 },
        ],
        images: [IMG.saree],
      },
      {
        vendor: savedVendors[2]._id,
        name: 'Zardozi Embroidered Anarkali',
        description: 'Grand festive floor-length anarkali in rich mulberry silk, accompanied by a zari organza dupatta.',
        category: 'WOMEN',
        subCategory: 'Festive Anarkali',
        price: 8900,
        mrp: 11500,
        brand: 'Kala Niketan',
        material: 'Mulberry Silk & Organza',
        fit: 'Flared Royal Fit',
        careInstructions: 'Specialist Dry Clean Only',
        isAvailable: true,
        status: PRODUCT_STATUS.APPROVED,
        sizes: [
          { size: 'S', stock: 2 },
          { size: 'M', stock: 3 },
          { size: 'L', stock: 2 },
        ],
        images: [IMG.anarkali],
      },
    ];

    for (const p of products) {
      await Product.findOneAndUpdate(
        { name: p.name, vendor: p.vendor },
        p,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Synced product: ${p.name} - ₹${p.price}`);
    }

    console.log('Seeding complete! 3 Nagpur Boutiques & 5 Garments are live.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
