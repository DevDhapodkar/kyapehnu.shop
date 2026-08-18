import mongoose from 'mongoose';
import {
  PLATFORM_FEE_PAISE,
  DEFAULT_DELIVERY_FEE_PAISE,
  DEFAULT_TAX_BPS,
} from '../constants/money.js';

/**
 * Singleton platform configuration, editable from the admin portal so ops can
 * change the platform fee, the default margin suggested at product approval,
 * and the delivery fee without a redeploy. Always fetched via `getSettings()`,
 * which lazily creates the single document on first run.
 */
const platformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'GLOBAL', unique: true },
    platformFeePaise: { type: Number, default: PLATFORM_FEE_PAISE, min: 0 },
    deliveryFeePaise: { type: Number, default: DEFAULT_DELIVERY_FEE_PAISE, min: 0 },
    taxBps: { type: Number, default: DEFAULT_TAX_BPS, min: 0 },
    /** Default platform margin (paise) pre-filled in the approval form. */
    defaultMarginPaise: { type: Number, default: 5000, min: 0 }, // ₹50
    /** COD is the only tender until the payment gateway is live post-registration. */
    codEnabled: { type: Boolean, default: true },
    onlinePaymentsEnabled: { type: Boolean, default: false },
    /** Max order value allowed on COD, in paise (fraud guard). ₹15,000 default. */
    codMaxOrderPaise: { type: Number, default: 1500000, min: 0 },
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);

let cached = null;

export const getSettings = async () => {
  if (cached) return cached;
  cached = await PlatformSetting.findOneAndUpdate(
    { key: 'GLOBAL' },
    { $setOnInsert: { key: 'GLOBAL' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return cached;
};

export const updateSettings = async (patch) => {
  cached = await PlatformSetting.findOneAndUpdate({ key: 'GLOBAL' }, patch, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
  return cached;
};

/** Test/ops helper to drop the in-process cache. */
export const clearSettingsCache = () => {
  cached = null;
};

export default PlatformSetting;
