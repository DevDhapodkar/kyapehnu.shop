import VendorApplication, { APPLICATION_STATUS } from '../models/VendorApplication.js';
import Vendor from '../models/Vendor.js';
import { approveVendor, revokeVendor } from '../services/vendorProvisioning.js';

/**
 * Admin controller for the vendor-review panel. Every route runs behind
 * `verifyToken` + `requireAdmin`. The admin can see every application, edit any
 * field on it, approve it (which provisions the real vendor), reject it, and
 * also edit the live Vendor records directly — "change everything and anything".
 */

/* --------------------------------------------------------- applications -- */

// Fields the admin is allowed to edit on an application. Identity and workflow
// bookkeeping (firebaseUid, status, reviewedBy…) are managed by the actions.
const EDITABLE_APPLICATION_FIELDS = [
  'shopName',
  'ownerName',
  'phone',
  'whatsappNumber',
  'email',
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

/** GET /api/admin/vendor-applications?status=PENDING */
const listApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await VendorApplication.find(filter).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list applications', error: error.message });
  }
};

/** GET /api/admin/vendor-applications/:id */
const getApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findById(req.params.id).populate('vendor');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load application', error: error.message });
  }
};

/** PATCH /api/admin/vendor-applications/:id — edit any submitted field. */
const updateApplication = async (req, res) => {
  try {
    const updates = pick(req.body, EDITABLE_APPLICATION_FIELDS);
    const application = await VendorApplication.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid update', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update application', error: error.message });
  }
};

/**
 * POST /api/admin/vendor-applications/:id/approve
 * Promote the applicant: flip their Firestore role to VENDOR and create/refresh
 * the Vendor document from the (possibly admin-edited) application snapshot.
 */
const approveApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status === APPLICATION_STATUS.APPROVED) {
      return res.status(409).json({ message: 'Application is already approved.' });
    }

    const profile = {
      shopName: application.shopName,
      ownerName: application.ownerName,
      phone: application.phone,
      whatsappNumber: application.whatsappNumber,
      address: application.address,
      location: application.location,
      operatingHours: application.operatingHours,
    };

    const vendor = await approveVendor({
      uid: application.firebaseUid,
      email: application.email,
      profile,
    });

    application.status = APPLICATION_STATUS.APPROVED;
    application.reviewedBy = req.firebaseUser.email;
    application.reviewedAt = new Date();
    application.adminNotes = req.body.adminNotes ?? application.adminNotes;
    application.vendor = vendor._id;
    await application.save();

    res.json({ application, vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve application', error: error.message });
  }
};

/** POST /api/admin/vendor-applications/:id/reject — with an optional reason. */
const rejectApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.status = APPLICATION_STATUS.REJECTED;
    application.adminNotes = req.body.adminNotes ?? application.adminNotes;
    application.reviewedBy = req.firebaseUser.email;
    application.reviewedAt = new Date();
    await application.save();

    // If they had previously been approved and are now rejected, pull access.
    await revokeVendor({ uid: application.firebaseUid, email: application.email });

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject application', error: error.message });
  }
};

/* --------------------------------------------------------------- vendors -- */

const EDITABLE_VENDOR_FIELDS = [
  'shopName',
  'ownerName',
  'phone',
  'whatsappNumber',
  'email',
  'address',
  'location',
  'operatingHours',
  'isActive',
  'rating',
];

/** GET /api/admin/vendors */
const listVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list vendors', error: error.message });
  }
};

/** PATCH /api/admin/vendors/:id — edit any field on a live shop. */
const updateVendor = async (req, res) => {
  try {
    const updates = pick(req.body, EDITABLE_VENDOR_FIELDS);
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid update', error: error.message });
    }
    res.status(500).json({ message: 'Failed to update vendor', error: error.message });
  }
};

export {
  listApplications,
  getApplication,
  updateApplication,
  approveApplication,
  rejectApplication,
  listVendors,
  updateVendor,
};
