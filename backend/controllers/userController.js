import User from '../models/User.js';
import { serverError } from '../utils/httpError.js';

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
    serverError(res, 'Failed to sync profile', error);
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
    serverError(res, 'Failed to add address', error);
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lng, lat } = req.body;
    req.user.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    serverError(res, 'Failed to update location', error);
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
    serverError(res, 'Failed to save push token', error);
  }
};

export { syncProfile, getProfile, addAddress, updateLocation, savePushToken };
