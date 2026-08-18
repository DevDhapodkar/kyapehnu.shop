import VendorApplication, { APPLICATION_STATUS } from '../models/VendorApplication.js';

/**
 * Applicant-facing controller for the "Apply to become a vendor" flow. All
 * routes run behind `verifyToken`, so the applicant is always the authenticated
 * Firebase account — they can only ever touch their own application.
 */

const APPLICANT_FIELDS = [
  'shopName',
  'ownerName',
  'phone',
  'whatsappNumber',
  'category',
  'description',
  'yearsInBusiness',
  'gstin',
  'address',
  'location',
  'operatingHours',
];

const pick = (source, keys) =>
  keys.reduce((out, key) => {
    if (source[key] !== undefined) out[key] = source[key];
    return out;
  }, {});

/**
 * POST /api/vendor-applications
 * Submit a new application, or update the existing one while it is still
 * pending/rejected. An already-approved account cannot re-apply.
 */
const submitApplication = async (req, res) => {
  try {
    const existing = await VendorApplication.findOne({ firebaseUid: req.firebaseUser.uid });

    if (existing && existing.status === APPLICATION_STATUS.APPROVED) {
      return res.status(409).json({ message: 'You are already an approved vendor.' });
    }

    const fields = pick(req.body, APPLICANT_FIELDS);
    const payload = {
      ...fields,
      firebaseUid: req.firebaseUser.uid,
      email: req.firebaseUser.email,
      // Any resubmission after a rejection re-enters the queue.
      status: APPLICATION_STATUS.PENDING,
      adminNotes: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    const application = await VendorApplication.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.status(201).json(application);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Some details are missing or invalid.', error: error.message });
    }
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
};

/**
 * GET /api/vendor-applications/me
 * The applicant's own application (or null), so the app can show status.
 */
const getMyApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findOne({ firebaseUid: req.firebaseUser.uid });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load application', error: error.message });
  }
};

export { submitApplication, getMyApplication };
