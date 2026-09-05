import User from '../models/User.js';

// Upsert the User profile linked to the authenticated Firebase account.
const syncProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userEmail = (email || req.firebaseUser?.email || '').toLowerCase().trim();
    const userName = name || req.firebaseUser?.name || 'Nagpur Patron';

    let user = await User.findOne({
      $or: [
        { firebaseUid: req.firebaseUser.uid },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    });

    if (user) {
      user.firebaseUid = req.firebaseUser.uid;
      if (userName) user.name = userName;
      if (userEmail) user.email = userEmail;
      if (phone) user.phone = phone;
      await user.save();
    } else {
      user = await User.create({
        firebaseUid: req.firebaseUser.uid,
        name: userName,
        email: userEmail || `user_${Date.now()}@kyapehnu.local`,
        phone: phone || '+91 99999 99999',
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync profile', error: error.message });
  }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const addAddress = async (req, res) => {
  try {
    req.user.savedAddresses.push(req.body);
    await req.user.save();
    res.status(201).json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add address', error: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    req.user.savedAddresses = req.user.savedAddresses.filter(
      (a) => String(a._id) !== String(addressId)
    );
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete address', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lng, lat } = req.body;
    req.user.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};

// Register an FCM device token for order-status notifications (deduped).
const savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required' });
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { pushTokens: token } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save push token', error: error.message });
  }
};

export { syncProfile, getProfile, addAddress, deleteAddress, updateLocation, savePushToken };
