import { addDoc, collection } from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { buildOrders } from './checkout';

/**
 * Write a cart's orders to Firestore — one document per vendor — so a checkout
 * lands on the right shop's desk in real time. The customer must be signed in
 * (customerUid is stamped from their uid, which firestore.rules requires on
 * create). Returns the created orders with their new ids.
 */

/** Whether checkout can persist orders (Firebase configured + a signed-in user). */
export const canPlaceOrders = () => Boolean(isFirebaseConfigured() && db && auth?.currentUser);

export async function placeOrders(cartItems, { customer, deliveryAddress }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to place an order.');

  const orders = buildOrders(cartItems, { customer, deliveryAddress, customerUid: user.uid });

  const created = [];
  for (const order of orders) {
    const ref = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: new Date().toISOString(),
    });
    created.push({ _id: ref.id, ...order });
  }
  return created;
}

export default placeOrders;
