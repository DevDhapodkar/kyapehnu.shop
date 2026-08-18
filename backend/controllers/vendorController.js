import Vendor from '../models/Vendor.js';
import { asyncHandler } from '../lib/errors.js';

/**
 * POST /api/vendors/sync — vendor onboarding. On first creation the shop is
 * PENDING_APPROVAL and stays invisible to customers until an admin approves it.
 * A re-sync of an existing shop never silently flips its approved status.
 */
export const syncProfile = asyncHandler(async (req, res) => {
  const { shopName, ownerName, phone, whatsappNumber, email, address, location, operatingHours, kyc } =
    req.body;

  const existing = await Vendor.findOne({ firebaseUid: req.firebaseUser.uid });

  if (existing) {
    Object.assign(existing, {
      shopName,
      ownerName,
      phone,
      whatsappNumber,
      email,
      address,
      location,
      operatingHours,
      ...(kyc ? { kyc: { ...existing.kyc?.toObject?.(), ...kyc } } : {}),
    });
    await existing.save();
    return res.json(existing);
  }

  const vendor = await Vendor.create({
    firebaseUid: req.firebaseUser.uid,
    shopName,
    ownerName,
    phone,
    whatsappNumber,
    email,
    address,
    location,
    operatingHours,
    kyc,
    status: 'PENDING_APPROVAL',
  });
  res.status(201).json(vendor);
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.vendor);
});

/** GET /api/vendors/nearby — customer discovery: APPROVED shops within radius. */
export const listNearby = asyncHandler(async (req, res) => {
  const { lng, lat, maxDistanceMeters } = req.validatedQuery;
  const vendors = await Vendor.find({
    status: 'APPROVED',
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: maxDistanceMeters,
      },
    },
  }).limit(50);
  res.json(vendors);
});

/** POST /api/vendors/push-token — register an Expo push token for the shop. */
export const registerPushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!req.vendor.expoPushTokens.includes(token)) {
    req.vendor.expoPushTokens.push(token);
    await req.vendor.save();
  }
  res.status(204).end();
});

export default { syncProfile, getProfile, listNearby, registerPushToken };
