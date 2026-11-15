import mongoose from 'mongoose';

const platformConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },

    // Delivery & Pan-India serviceability rules
    delivery: {
      baseFee: { type: Number, default: 49 },
      freeDeliveryThreshold: { type: Number, default: 999 },
      corridorRadiusKm: { type: Number, default: 15 },
      instantDeliveryEnabled: { type: Boolean, default: true },
      estimatedDeliveryMinutes: { type: Number, default: 45 },
      activeZones: {
        type: [String],
        default: [
          'Sitabuldi',
          'Dharampeth',
          'Ramdaspeth',
          'Sadar',
          'Civil Lines',
          'Dhantoli',
          'Laxmi Nagar',
          'Pratap Nagar',
          'MIHAN Airport',
          'Wardha Road',
          'Manish Nagar',
          'Nandanvan',
        ],
      },
    },

    // Broadcast announcement banner shown to all shoppers
    announcement: {
      enabled: { type: Boolean, default: true },
      text: {
        type: String,
        default: '⚡ Express Boutique Delivery across India. Try on at home!',
      },
      tag: { type: String, default: 'EXPRESS' }, // 'EXPRESS' | 'OFFER' | 'ALERT'
      link: { type: String, default: '/app' },
    },

    // Payment gateway & UPI preferences
    payments: {
      codEnabled: { type: Boolean, default: true },
      upiEnabled: { type: Boolean, default: true },
      upiVpa: { type: String, default: 'kyapehnu@icici' },
      merchantName: { type: String, default: 'Kya Pehnu' },
    },

    // Store status / maintenance
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: {
        type: String,
        default: 'Kya Pehnu is undergoing brief scheduled maintenance. We will be back shortly!',
      },
    },

    // Support and helpline
    support: {
      phone: { type: String, default: '+91 81607 97733' },
      whatsapp: { type: String, default: '+91 81607 97733' },
      email: { type: String, default: 'support@kyapehnu.shop' },
      operatingHours: { type: String, default: '10:00 AM - 10:00 PM' },
    },
  },
  { timestamps: true }
);

/**
 * Singleton helper: always fetches or creates the single global config document.
 */
platformConfigSchema.statics.getGlobal = async function () {
  let config = await this.findOne({ key: 'global' });
  if (!config) {
    config = await this.create({ key: 'global' });
  }
  return config;
};

export default mongoose.model('PlatformConfig', platformConfigSchema);
