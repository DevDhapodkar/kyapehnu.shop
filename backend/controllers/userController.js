import User from '../models/User.js';

// Upsert the User profile linked to the authenticated Firebase account.
const syncProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userEmail = (email || req.firebaseUser?.email || '').toLowerCase().trim();
    const firebaseName = req.firebaseUser?.name || '';
    const emailLocal = userEmail.includes('@') ? userEmail.split('@')[0] : '';
    const userName = (name || firebaseName || emailLocal || '').trim();
    const cleanPhone = phone != null ? String(phone).trim() : '';
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    const hasValidPhone = phoneDigits.length >= 10 && phoneDigits.slice(-10) !== '9999999999';

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
      if (hasValidPhone) user.phone = cleanPhone;
      await user.save();
    } else {
      if (!userName) {
        return res.status(400).json({ message: 'Name is required to create a profile.' });
      }
      if (!userEmail) {
        return res.status(400).json({ message: 'Email is required to create a profile.' });
      }
      if (!hasValidPhone) {
        return res.status(400).json({
          message: 'A valid 10-digit mobile number is required. Placeholder numbers are not accepted.',
        });
      }
      user = await User.create({
        firebaseUid: req.firebaseUser.uid,
        name: userName,
        email: userEmail,
        phone: cleanPhone,
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
