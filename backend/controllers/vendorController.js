import Vendor from '../models/Vendor.js';

const syncProfile = async (req, res) => {
  try {
    const { shopName, ownerName, phone, whatsappNumber, email, address, location, operatingHours } = req.body;

    const userEmail =
      email ||
      req.firebaseUser?.email ||
      `${(shopName || 'vendor').toLowerCase().replace(/[^a-z0-9]/g, '')}@kyapehnu.local`;

    const formattedAddress =
      address && address.line1
        ? address
        : {
            line1: req.body.line1 || 'West High Court Road',
            area: req.body.area || 'Dharampeth',
            city: req.body.city || 'Nagpur',
            pincode: req.body.pincode || '440001',
          };

    const formattedLocation =
      location && Array.isArray(location.coordinates) && location.coordinates.length === 2
        ? location
        : {
            type: 'Point',
            coordinates: [79.0882, 21.1458],
          };

    const vendor = await Vendor.findOneAndUpdate(
      {
        $or: [
          { firebaseUid: req.firebaseUser.uid },
          ...(userEmail ? [{ email: userEmail.toLowerCase() }] : []),
        ],
      },
      {
        firebaseUid: req.firebaseUser.uid,
        shopName: shopName || 'Nagpur Atelier',
        ownerName: ownerName || 'Atelier Designer',
        phone: phone || '+91 712 254 9900',
        whatsappNumber: whatsappNumber || phone,
        email: userEmail,
        address: formattedAddress,
        location: formattedLocation,
        operatingHours,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync vendor profile', error: error.message });
  }
};

const getProfile = async (req, res) => {
  res.json(req.vendor);
};

// Nearby vendors for the customer app's discovery feed.
const listNearby = async (req, res) => {
  try {
    const { lng, lat, maxDistanceMeters = 50000 } = req.query;

    const parsedLng = parseFloat(lng);
    const parsedLat = parseFloat(lat);
    const coordinates =
      !isNaN(parsedLng) && !isNaN(parsedLat)
        ? [parsedLng, parsedLat]
        : [79.0882, 21.1458];

    let vendors = [];
    try {
      vendors = await Vendor.find({
        isActive: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates },
            $maxDistance: parseInt(maxDistanceMeters, 10) || 50000,
          },
        },
      });
    } catch (_geoErr) {
      vendors = await Vendor.find({ isActive: true }).limit(20);
    }

    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list nearby vendors', error: error.message });
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
    res.status(500).json({ message: 'Failed to save push token', error: error.message });
  }
};

export { syncProfile, getProfile, listNearby, savePushToken };
