import Order, { ORDER_STATUSES } from '../models/Order.js';
import Vendor from '../models/Vendor.js';
import { notifyVendorNewOrder } from './whatsappController.js';
import { requestDriver } from './porterController.js';

const createOrder = async (req, res) => {
  try {
    const { vendor: vendorId, items, totalPrice, deliveryAddress } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const order = await Order.create({
      customer: req.user._id,
      vendor: vendorId,
      items,
      totalPrice,
      deliveryAddress,
      status: 'PENDING',
    });

    notifyVendorNewOrder(vendor, order).catch((err) =>
      console.error(`WhatsApp notify failed for order ${order._id}:`, err.message)
    );

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('vendor', 'shopName whatsappNumber location address');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of ${ORDER_STATUSES.join(', ')}` });
    }

    const order = await Order.findById(req.params.id).populate('vendor');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    // Automatically dispatch a Porter driver once the vendor marks the order ready.
    if (status === 'READY_FOR_PICKUP') {
      try {
        const porterResponse = await requestDriver(order, order.vendor);
        order.porter.requestId = porterResponse?.order_id;
        order.status = 'IN_TRANSIT';
        await order.save();
      } catch (porterError) {
        console.error(`Porter dispatch failed for order ${order._id}:`, porterError.message);
        // Order stays READY_FOR_PICKUP so it can be retried/dispatched manually.
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

export { createOrder, getOrderById, updateOrderStatus };
