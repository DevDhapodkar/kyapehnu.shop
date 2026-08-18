import express from 'express';
import { verifyWebhook, handleIncomingWebhook } from '../controllers/whatsappController.js';

const router = express.Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingWebhook);

export default router;
