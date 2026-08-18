import User from '../models/User.js';
import { asyncHandler } from '../lib/errors.js';

/** POST /api/users/sync — upsert the customer profile for the Firebase account. */
export const syncProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await User.findOneAndUpdate(
    { firebaseUid: req.firebaseUser.uid },
    { firebaseUid: req.firebaseUser.uid, name, email, phone },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(user);
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const addAddress = asyncHandler(async (req, res) => {
  req.user.savedAddresses.push(req.body);
  await req.user.save();
  res.status(201).json(req.user);
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { lng, lat } = req.body;
  req.user.currentLocation = { type: 'Point', coordinates: [lng, lat] };
  await req.user.save();
  res.json(req.user);
});

/** POST /api/users/push-token — register an Expo push token (deduplicated). */
export const registerPushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!req.user.expoPushTokens.includes(token)) {
    req.user.expoPushTokens.push(token);
    await req.user.save();
  }
  res.status(204).end();
});

export default { syncProfile, getProfile, addAddress, updateLocation, registerPushToken };
