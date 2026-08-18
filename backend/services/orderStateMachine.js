/**
 * Order lifecycle state machine. Pure and framework-free so the legal
 * transitions are declared in exactly one place and can be unit-tested.
 *
 * Closes the "vendor can jump PENDING → DELIVERED" fraud gap the security
 * review flagged: every status write goes through `assertTransition`, which
 * rejects illegal edges instead of writing whatever the client sent.
 *
 * Actors: who is allowed to drive a given edge.
 *   - CUSTOMER: the buyer who placed the order
 *   - VENDOR:   the shop fulfilling it
 *   - ADMIN:    platform staff (can also force-cancel)
 *   - SYSTEM:   automated (e.g. Porter dispatch advancing to IN_TRANSIT)
 */

export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
});

export const ORDER_STATUSES = Object.freeze(Object.values(ORDER_STATUS));

/** Terminal states — no outgoing edges, and the point at which stock is settled. */
export const TERMINAL_STATUSES = Object.freeze([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
]);

/** States in which the reserved stock must be returned to inventory. */
export const RESTOCK_STATUSES = Object.freeze([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
]);

/**
 * Adjacency map: from → { to → [allowed actors] }.
 * READY_FOR_PICKUP → IN_TRANSIT is SYSTEM (Porter) *or* VENDOR/ADMIN, because
 * while Porter is deferred a vendor/admin advances the order by hand.
 */
const TRANSITIONS = Object.freeze({
  PENDING: {
    ACCEPTED: ['VENDOR', 'ADMIN'],
    REJECTED: ['VENDOR', 'ADMIN'],
    CANCELLED: ['CUSTOMER', 'ADMIN'],
  },
  ACCEPTED: {
    READY_FOR_PICKUP: ['VENDOR', 'ADMIN'],
    CANCELLED: ['ADMIN'],
  },
  READY_FOR_PICKUP: {
    IN_TRANSIT: ['SYSTEM', 'VENDOR', 'ADMIN'],
    CANCELLED: ['ADMIN'],
  },
  IN_TRANSIT: {
    DELIVERED: ['SYSTEM', 'VENDOR', 'ADMIN'],
    CANCELLED: ['ADMIN'],
  },
  DELIVERED: {},
  CANCELLED: {},
  REJECTED: {},
});

export const isTerminal = (status) => TERMINAL_STATUSES.includes(status);

export const shouldRestock = (status) => RESTOCK_STATUSES.includes(status);

/** All legal next states from `status`, ignoring actor. */
export const nextStates = (status) => Object.keys(TRANSITIONS[status] || {});

/** True if `actor` may move an order from `from` to `to`. */
export const canTransition = (from, to, actor) => {
  const actors = TRANSITIONS[from]?.[to];
  return Array.isArray(actors) && actors.includes(actor);
};

/**
 * Throws a tagged Error if the transition is illegal. Callers translate the
 * `.code` into an HTTP 409/403. Keeps the machine the single arbiter of truth.
 */
export const assertTransition = (from, to, actor) => {
  if (!ORDER_STATUSES.includes(to)) {
    const err = new Error(`Unknown target status: ${to}`);
    err.code = 'INVALID_STATUS';
    throw err;
  }
  if (from === to) {
    const err = new Error(`Order is already ${from}`);
    err.code = 'NO_OP_TRANSITION';
    throw err;
  }
  if (!TRANSITIONS[from]) {
    const err = new Error(`Order in terminal/unknown state ${from} cannot transition`);
    err.code = 'ILLEGAL_TRANSITION';
    throw err;
  }
  if (!canTransition(from, to, actor)) {
    const legal = nextStates(from).join(', ') || '(none)';
    const err = new Error(
      `Illegal transition ${from} → ${to} for ${actor}. Allowed from ${from}: ${legal}`
    );
    err.code = 'ILLEGAL_TRANSITION';
    throw err;
  }
  return true;
};
