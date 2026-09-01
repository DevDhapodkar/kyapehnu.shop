import Vendor from '../models/Vendor.js';
import { serverError } from '../utils/httpError.js';

const syncProfile = async (req, res) => {
  try {
    const { shopName, ownerName, phone, whatsappNumber, email, address, location, operatingHours } = req.body;

    const vendor = await Vendor.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      {
        firebaseUid: req.firebaseUser.uid,
        shopName,
        ownerName,
        phone,
        whatsappNumber,
        email,
        address,
        location,
        operatingHours,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(vendor);
  } catch (error) {
    serverError(res, 'Failed to sync vendor profile', error);
  }
};

const getProfile = async (req, res) => {
  res.json(req.vendor);
};

// Fields safe to expose on the public discovery feed. Deliberately excludes the
// owner's phone/email/whatsappNumber, the firebaseUid, and the FCM pushTokens —
// none of which a browsing customer needs, and all of which this unauthenticated
// route used to hand out with the full vendor document.
export const PUBLIC_VENDOR_FIELDS = 'shopName address location operatingHours rating isActive';

// A single order can never be delivered further than the city; cap the radius
// so a caller cannot turn this into a full vendor dump with one huge query.
const MAX_NEARBY_METERS = 20000;

// Nearby vendors for the customer app's discovery feed.
const listNearby = async (req, res) => {
  try {
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return res.status(400).json({ message: 'Valid lng and lat query params are required' });
    }

    const requested = parseInt(req.query.maxDistanceMeters, 10);
    const maxDistance = Math.min(Number.isFinite(requested) && requested > 0 ? requested : 5000, MAX_NEARBY_METERS);

    const vendors = await Vendor.find({
      isActive: true,
      approvalStatus: 'APPROVED',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      },
    }).select(PUBLIC_VENDOR_FIELDS);

    res.json(vendors);
  } catch (error) {
    serverError(res, 'Failed to list nearby vendors', error);
  }
};

// Register an FCM device token so the shop's device gets new-order alerts.
const savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required' });
    await Vendor.updateOne(
      { _id: req.vendor._id },
      { $addToSet: { pushTokens: token } }
    );
    res.json({ ok: true });
  } catch (error) {
    serverError(res, 'Failed to save push token', error);
  }
};

export { syncProfile, getProfile, listNearby, savePushToken };
