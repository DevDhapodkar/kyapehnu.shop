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

// Nearby vendors for the customer app's discovery feed.
const listNearby = async (req, res) => {
  try {
    const { lng, lat, maxDistanceMeters = 5000 } = req.query;

    const vendors = await Vendor.find({
      isActive: true,
      approvalStatus: 'APPROVED',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistanceMeters, 10),
        },
      },
    });

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
