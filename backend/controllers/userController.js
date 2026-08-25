import User from '../models/User.js';

// Upsert the User profile linked to the authenticated Firebase account.
const syncProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      { firebaseUid: req.firebaseUser.uid, name, email, phone },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

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

// Register an Expo push token for order-status notifications (deduped).
const savePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required' });
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { expoPushTokens: token } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save push token', error: error.message });
  }
};

export { syncProfile, getProfile, addAddress, updateLocation, savePushToken };
