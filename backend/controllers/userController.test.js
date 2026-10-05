import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User.js';
import { syncProfile } from './userController.js';

dotenv.config();

test('syncProfile: Google OAuth and email linking', async (t) => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kyapehnu');

  const stamp = Date.now();
  const createdIds = [];

  const mockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  };

  t.after(async () => {
    if (createdIds.length) await User.deleteMany({ _id: { $in: createdIds } });
    await mongoose.disconnect();
  });

  await t.test('creates profile for Google OAuth user without a phone number', async () => {
    const req = {
      firebaseUser: {
        uid: `google_uid_${stamp}`,
        email: `google_${stamp}@kyapehnu.shop`,
        name: 'Google Shopper',
        email_verified: true,
        firebase: { sign_in_provider: 'google.com' },
      },
      body: {
        name: 'Google Shopper',
        email: `google_${stamp}@kyapehnu.shop`,
        phone: '',
      },
    };
    const res = mockRes();

    await syncProfile(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.jsonData._id);
    assert.equal(res.jsonData.email, `google_${stamp}@kyapehnu.shop`);
    assert.equal(res.jsonData.phone, '');
    createdIds.push(res.jsonData._id);
  });

  await t.test('links existing user with matching verified Google email without duplicate error', async () => {
    const existingEmail = `existing_${stamp}@kyapehnu.shop`;
    const initialUser = await User.create({
      firebaseUid: `email_uid_${stamp}`,
      name: 'Existing Customer',
      email: existingEmail,
      phone: '9823055443',
    });
    createdIds.push(initialUser._id);

    // Google user logs in with the same email
    const req = {
      firebaseUser: {
        uid: `new_google_uid_${stamp}`,
        email: existingEmail,
        name: 'Existing Customer',
        email_verified: true,
        firebase: { sign_in_provider: 'google.com' },
      },
      body: {
        name: 'Existing Customer',
        email: existingEmail,
      },
    };
    const res = mockRes();

    await syncProfile(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(String(res.jsonData._id), String(initialUser._id));
    assert.equal(res.jsonData.firebaseUid, `new_google_uid_${stamp}`);
  });

  await t.test('rejects non-OAuth user profile creation without valid phone', async () => {
    const req = {
      firebaseUser: {
        uid: `unverified_uid_${stamp}`,
        email: `non_oauth_${stamp}@kyapehnu.shop`,
        name: 'Test Shopper',
        email_verified: false,
        firebase: { sign_in_provider: 'password' },
      },
      body: {
        name: 'Test Shopper',
        email: `non_oauth_${stamp}@kyapehnu.shop`,
        phone: '',
      },
    };
    const res = mockRes();

    await syncProfile(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.jsonData.message, /valid 10-digit mobile number is required/i);
  });
});
