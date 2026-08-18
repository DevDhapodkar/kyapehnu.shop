import express from 'express';

import { verifyToken } from '../middleware/authMiddleware.js';
import { submitApplication, getMyApplication } from '../controllers/vendorApplicationController.js';

const router = express.Router();

// Applicant-facing: submit / update and check status of your own application.
router.post('/', verifyToken, submitApplication);
router.get('/me', verifyToken, getMyApplication);

export default router;
