import express from 'express';
import { handleIncomingWebhook, verifyWebhook } from '../controllers/whatsappController.js';

const router = express.Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingWebhook);

export default router;
