import Invoice from '../models/Invoice.js';
import { nextSequence } from '../models/Counter.js';

/** KP-INV-2026-000001 */
const buildInvoiceNumber = (seq, year) =>
  `KP-INV-${year}-${String(seq).padStart(6, '0')}`;

/**
 * Generate the immutable billing document for an order. Called inside the order
 * creation transaction so an order and its invoice are always created together.
 */
export const generateInvoiceForOrder = async ({ order, vendor, customer }, session) => {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`invoice-${year}`, session);
  const invoiceNumber = buildInvoiceNumber(seq, year);

  const addr = order.deliveryAddress;
  const [invoice] = await Invoice.create(
    [
      {
        invoiceNumber,
        order: order._id,
        seller: {
          vendor: vendor._id,
          shopName: vendor.shopName,
          address: `${vendor.address?.line1 || ''}, ${vendor.address?.area || ''}, ${vendor.address?.city || 'Nagpur'} ${vendor.address?.pincode || ''}`.trim(),
          gstin: vendor.kyc?.gstin || '',
        },
        buyer: {
          customer: customer._id,
          name: customer.name,
          deliveryAddress: `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city} ${addr.pincode}`,
        },
        lines: order.items.map((it) => ({
          name: it.name,
          size: it.size,
          quantity: it.quantity,
          unitSellingPricePaise: it.unitSellingPricePaise,
          lineTotalPaise: it.lineTotalPaise,
        })),
        itemsSubtotalPaise: order.pricing.itemsSubtotalPaise,
        deliveryFeePaise: order.pricing.deliveryFeePaise,
        taxPaise: order.pricing.taxPaise,
        platformFeePaise: order.pricing.platformFeePaise,
        grandTotalPaise: order.pricing.grandTotalPaise,
        paymentMethod: order.payment.method,
        currency: order.pricing.currency,
      },
    ],
    session ? { session } : {}
  );

  return invoice;
};

export default generateInvoiceForOrder;
