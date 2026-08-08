import axios from 'axios';

const META_API_URL = `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`;

// Placeholder: notify a vendor on WhatsApp that a new order landed.
// Wire this to be called from orderController whenever an order is created.
const notifyVendorNewOrder = async (vendor, order) => {
  try {
    const response = await axios.post(
      META_API_URL,
      {
        messaging_product: 'whatsapp',
        to: vendor.whatsappNumber,
        type: 'template',
        template: {
          name: 'new_order_alert',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: vendor.shopName },
                { type: 'text', text: order._id.toString() },
                { type: 'text', text: `₹${order.totalPrice}` },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp notify failed:', error.response?.data || error.message);
    throw error;
  }
};

// Placeholder: incoming webhook from Meta Cloud API for vendor replies
// (e.g. vendor managing inventory via WhatsApp chat commands).
const handleIncomingWebhook = async (req, res) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  // TODO: parse body.entry[].changes[].value.messages[] and route
  // inventory commands (e.g. "STOCK <sku> <qty>") to the Product model.
  console.log('Incoming WhatsApp webhook:', JSON.stringify(body));

  res.sendStatus(200);
};

const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export { notifyVendorNewOrder, handleIncomingWebhook, verifyWebhook };
