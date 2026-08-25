// Mirror of the backend fulfilment lifecycle, for rendering the customer's
// order timeline. Keep in sync with backend/utils/orderStatus.js.

export const ORDER_TIMELINE = [
  'PENDING',
  'ACCEPTED',
  'PACKED',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'DELIVERED',
];

export const CUSTOMER_CANCELLABLE = ['PENDING', 'ACCEPTED'];

// Short labels for the timeline dots.
export const STEP_LABELS = {
  PENDING: 'Placed',
  ACCEPTED: 'Accepted',
  PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready',
  IN_TRANSIT: 'Out for delivery',
  DELIVERED: 'Delivered',
};

export const stepIndex = (status) => ORDER_TIMELINE.indexOf(status);

export const isCancellable = (status) => CUSTOMER_CANCELLABLE.includes(status);

export const isCancelled = (status) => status === 'CANCELLED';
