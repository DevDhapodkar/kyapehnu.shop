import Vendor from '../models/Vendor.js';

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
    res.status(500).json({ message: 'Failed to sync vendor profile', error: error.message });
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
    res.status(500).json({ message: 'Failed to list nearby vendors', error: error.message });
  }
};

export { syncProfile, getProfile, listNearby };
