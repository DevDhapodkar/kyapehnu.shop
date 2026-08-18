import { useState } from 'react';
import { Image } from 'expo-image';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassButton from '../components/GlassButton';
import { formatINR } from '../data/mockStores';
import { placeOrder } from '../api/customerApi';
import {
  computeBill,
  cartIsOrderable,
  toOrderItems,
  PAYMENT_METHOD_LABEL,
} from '../config/checkout';
import { selectCartItems, selectCartTotal, useCartStore } from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const savedAddress = useAuthStore((state) => state.user?.savedAddresses?.[0]);

  const [placing, setPlacing] = useState(false);

  const empty = cartItems.length === 0;
  const bill = computeBill(subtotal);
  const total = empty ? 0 : bill.total;

  /**
   * Checkout. When the cart holds real backend products (single vendor) and a
   * session token exists, this posts a Cash-on-Delivery order to `/orders` —
   * the server recomputes price + the ₹25 platform fee, decrements stock, and
   * issues an invoice. An idempotency key makes a double-tap safe. While the
   * storefront still serves mock data, it falls back to the local tracking demo
   * so nothing breaks before discovery is wired to the API.
   */
  const handleConfirm = async () => {
    if (placing) return;

    if (cartIsOrderable(cartItems)) {
      try {
        setPlacing(true);
        const vendorId = cartItems[0].storeId;
        const idempotencyKey = `co_${vendorId}_${Date.now()}`;
        const deliveryAddress = savedAddress || {
          line1: cartItems[0].storeArea || 'Nagpur',
          city: 'Nagpur',
          pincode: '440001',
          location: {
            type: 'Point',
            coordinates: cartItems[0].storeCoordinates || [79.0882, 21.1458],
          },
        };
        const order = await placeOrder({
          vendorId,
          items: toOrderItems(cartItems),
          deliveryAddress,
          idempotencyKey,
        });
        clearCart();
        navigation.navigate('LiveTracking', { order });
      } catch (err) {
        Alert.alert('Could not place order', err.message);
      } finally {
        setPlacing(false);
      }
      return;
    }

    // Demo fallback (mock catalogue, no real ids/token yet).
    const order = {
      id: `ord_${Date.now()}`,
      items: cartItems,
      total,
      placedAt: new Date().toISOString(),
    };
    clearCart();
    navigation.navigate('LiveTracking', { order });
  };

  if (empty) {
    return (
      <View style={styles.emptyRoot}>
        <Text style={styles.emptyGlyph}>◇</Text>
        <Text style={styles.emptyTitle}>Your bag is empty.</Text>
        <Text style={styles.emptyBody}>
          Nothing picked yet. The nearest shop is under a kilometre away.
        </Text>
        <GlassButton
          label="Browse Nearby"
          variant="ghost"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 230 },
        ]}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {cartItems.length} {cartItems.length === 1 ? 'piece' : 'pieces'} from{' '}
            {new Set(cartItems.map((item) => item.storeId)).size} store
            {new Set(cartItems.map((item) => item.storeId)).size === 1 ? '' : 's'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View pointerEvents="none" style={styles.lineFill} />
            <View pointerEvents="none" style={styles.lineHighlight} />

            <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />

            <View style={styles.lineBody}>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.lineMeta}>
                {item.size ? `${item.size}  ·  ` : ''}
                {item.colorway}
              </Text>
              <Text style={styles.lineStore} numberOfLines={1}>
                {item.storeName}
              </Text>

              <View style={styles.lineFooter}>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => removeFromCart(item.key)}
                    style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.stepGlyph}>−</Text>
                  </Pressable>
                  <Text style={styles.stepCount}>{item.quantity}</Text>
                  <Pressable
                    onPress={() => addToCart(item, item.size)}
                    style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.stepGlyph}>+</Text>
                  </Pressable>
                </View>

                <Text style={styles.linePrice}>
                  {formatINR(item.price * item.quantity)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => removeFromCart(item.key, { all: true })}
              hitSlop={10}
              style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
            >
              <Text style={styles.removeGlyph}>×</Text>
            </Pressable>
          </View>
        )}
      />

      {/* Docked summary. */}
      <View style={[styles.summary, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View pointerEvents="none" style={styles.summaryFill} />
        <View pointerEvents="none" style={styles.summaryHighlight} />

        <SummaryRow label="Subtotal" value={formatINR(bill.subtotal)} />
        <SummaryRow
          label="Delivery"
          value={bill.deliveryFee ? formatINR(bill.deliveryFee) : 'Free'}
        />
        <SummaryRow label="Platform fee" value={formatINR(bill.platformFee)} />

        <View style={styles.summaryDivider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatINR(total)}</Text>
        </View>

        <Text style={styles.payMethod}>Payment · {PAYMENT_METHOD_LABEL}</Text>

        <GlassButton
          label={placing ? 'Placing order…' : 'Place Order · Cash on Delivery'}
          onPress={handleConfirm}
          disabled={placing}
          caption={`${formatINR(total)}  ·  pay cash on delivery`}
          style={styles.confirm}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },

  emptyRoot: {
    flex: 1,
    backgroundColor: colors.obsidian,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyGlyph: {
    color: colors.graphite,
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.ivory,
    fontSize: 22,
    fontWeight: '300',
    marginBottom: spacing.xs,
  },
  emptyBody: {
    color: colors.ash,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.lg,
  },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  listHeader: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  line: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  lineFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFill,
  },
  lineHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  thumb: {
    width: 76,
    height: 100,
    borderRadius: radii.sm,
    backgroundColor: colors.charcoalLight,
  },
  lineBody: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingRight: spacing.md,
  },
  lineName: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '400',
  },
  lineMeta: {
    color: colors.platinum,
    fontSize: 12,
    marginTop: 3,
  },
  lineStore: {
    color: colors.slate,
    fontSize: 11,
    marginTop: 2,
  },
  lineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.charcoal,
  },
  stepButton: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: {
    color: colors.ivory,
    fontSize: 16,
    lineHeight: 19,
  },
  stepCount: {
    color: colors.ivory,
    fontSize: 13,
    minWidth: 18,
    textAlign: 'center',
  },
  linePrice: {
    color: colors.ivory,
    fontSize: 15,
    fontWeight: '600',
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.sm,
  },
  removeGlyph: {
    color: colors.slate,
    fontSize: 20,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.6,
  },

  summary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
    overflow: 'hidden',
  },
  summaryFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.glassFillStrong,
  },
  summaryHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    color: colors.ash,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.platinum,
    fontSize: 13,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 2.5,
  },
  totalValue: {
    color: colors.ivory,
    fontSize: 24,
    fontWeight: '600',
  },
  payMethod: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  confirm: {
    width: '100%',
  },
});
