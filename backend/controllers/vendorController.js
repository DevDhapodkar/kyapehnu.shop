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
        ? {
            ...address,
            pincode: address.pincode || undefined,
          }
        : req.body.line1
        ? {
            line1: req.body.line1,
            area: req.body.area || '',
            city: req.body.city || 'Nagpur',
            pincode: req.body.pincode,
          }
        : null;

    if (!formattedAddress?.line1 || !/^\d{6}$/.test(String(formattedAddress.pincode || ''))) {
      return res.status(400).json({
        message: 'Boutique address line and a valid 6-digit pincode are required.',
      });
    }

    const formattedLocation =
      location && Array.isArray(location.coordinates) && location.coordinates.length === 2
        ? location
        : {
            type: 'Point',
            coordinates: [79.0882, 21.1458],
          };

    let vendor = await Vendor.findOne({
      $or: [
        { firebaseUid: req.firebaseUser.uid },
        ...(userEmail ? [{ email: userEmail.toLowerCase() }] : []),
      ],
    });

    if (vendor) {
      vendor.firebaseUid = req.firebaseUser.uid;
      if (shopName) vendor.shopName = shopName;
      if (ownerName) vendor.ownerName = ownerName;
      if (phone) vendor.phone = phone;
      if (whatsappNumber || phone) vendor.whatsappNumber = whatsappNumber || phone;
      if (userEmail) vendor.email = userEmail;
      if (formattedAddress) vendor.address = formattedAddress;
      if (formattedLocation) vendor.location = formattedLocation;
      if (operatingHours) vendor.operatingHours = operatingHours;
      await vendor.save();
    } else {
      vendor = await Vendor.create({
        firebaseUid: req.firebaseUser.uid,
        shopName: shopName || 'Nagpur Atelier',
        ownerName: ownerName || 'Atelier Designer',
        phone: phone || '+91 712 254 9900',
        whatsappNumber: whatsappNumber || phone || '+91 712 254 9900',
        email: userEmail,
        address: formattedAddress,
        location: formattedLocation,
        operatingHours,
      });
    }

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
