import axios from 'axios';

const PORTER_API_BASE = 'https://pfe-apigw-uat.porter.in/v1';

// Placeholder: request a driver from Porter once an order is ready for pickup.
const requestDriver = async (order, vendor) => {
  try {
    const response = await axios.post(
      `${PORTER_API_BASE}/orders/create`,
      {
        request_id: order._id.toString(),
        pickup_details: {
          lat: vendor.location.coordinates[1],
          lng: vendor.location.coordinates[0],
          address: {
            apartment_address: vendor.address.line1,
            city: vendor.address.city,
            pincode: vendor.address.pincode,
          },
        },
        drop_details: {
          lat: order.deliveryAddress.location.coordinates[1],
          lng: order.deliveryAddress.location.coordinates[0],
          address: {
            apartment_address: order.deliveryAddress.line1,
            city: order.deliveryAddress.city,
            pincode: order.deliveryAddress.pincode,
          },
        },
      },
      {
        headers: {
          'X-API-KEY': process.env.PORTER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Porter driver request failed:', error.response?.data || error.message);
    throw error;
  }
};

export { requestDriver };
