/** Shared formatters, so no screen invents its own rupee or date rendering. */

/** Whole rupees — nothing in the catalogue is priced in paise. */
export const formatCurrency = (amount) =>
  `₹${Number(amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/**
 * Age of an order in the shortest form that is still unambiguous. A vendor
 * scanning the queue cares about "how long has this been sitting", not the
 * wall-clock time it arrived.
 */
export const formatAge = (isoDate) => {
  if (!isoDate) return '';

  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
};

/** "12 Palm Road, Nagpur · 440010" from an order's delivery address. */
export const formatAddress = (address) => {
  if (!address) return 'No address on file';

  return (
    [address.line1, address.city].filter(Boolean).join(', ') +
    (address.pincode ? ` · ${address.pincode}` : '')
  );
};

/** Last 6 characters of a Mongo id — enough to call out across a counter. */
export const shortOrderId = (id) => (id ? `#${String(id).slice(-6).toUpperCase()}` : '#------');

/** "3 items · 5 units" summary line. */
export const summariseItems = (items = []) => {
  const units = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const lines = items.length;

  return `${lines} ${lines === 1 ? 'item' : 'items'} · ${units} ${units === 1 ? 'unit' : 'units'}`;
};
