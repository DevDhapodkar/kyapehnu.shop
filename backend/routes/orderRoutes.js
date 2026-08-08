import express from 'express';
import { verifyToken, requireUser, requireVendor } from '../middleware/authMiddleware.js';
import { createOrder, getOrderById, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', verifyToken, requireUser, createOrder);
router.get('/:id', verifyToken, getOrderById);
router.patch('/:id/status', verifyToken, requireVendor, updateOrderStatus);

export default router;
