import express from 'express';
import { handleIncomingWebhook, verifyWebhook, testWebhookSimulate } from '../controllers/whatsappController.js';

const router = express.Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingWebhook);
router.post('/simulate', testWebhookSimulate);

export default router;
