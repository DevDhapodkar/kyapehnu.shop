// Order fulfilment state machine. A single source of truth for the allowed
// transitions, the customer-facing labels, and the timeline copy — shared by
// the controller (enforcement) and exported for tests.

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  PACKED: 'PACKED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUSES = Object.values(ORDER_STATUS);

// The happy path, in order — used to render a progress timeline in the app.
export const ORDER_TIMELINE = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.READY_FOR_PICKUP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.DELIVERED,
];

// What the buyer sees for each state.
export const ORDER_STATUS_LABELS = {
  PENDING: 'Order placed',
  ACCEPTED: 'Accepted by shop',
  PACKED: 'Packed',
  READY_FOR_PICKUP: 'Ready for pickup',
  IN_TRANSIT: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Allowed next states from each state (vendor-driven happy path).
const TRANSITIONS = {
  PENDING: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED],
  ACCEPTED: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  PACKED: [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED],
  READY_FOR_PICKUP: [ORDER_STATUS.IN_TRANSIT],
  IN_TRANSIT: [ORDER_STATUS.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

// States a customer is allowed to cancel from (before the shop has packed).
export const CUSTOMER_CANCELLABLE = [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED];

/**
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

/**
 * Append an immutable timeline entry.
 * @param {Array} history
 * @param {string} status
 * @param {string} [note]
 * @returns {Array}
 */
export const appendHistory = (history = [], status, note) => [
  ...history,
  { status, at: new Date(), note },
];
