import { useState } from 'react';
import { Image } from 'expo-image';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutRight, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import {
  AnimatedNumber,
  Button,
  EmptyState,
  Gradient,
  Icon,
  PressableScale,
  Surface,
} from '../components/ui';
import { formatINR } from '../data/mockStores';
import { selectCartItems, selectCartTotal, useCartStore } from '../store/useCartStore';
import { placeOrder } from '../api/vendorApi';
import { useAuthStore } from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';
import { duration, easing, elevation, stagger, type } from '../theme/tokens';
import { selection, success, failure } from '../utils/haptics';

/** Flat fee stand-in until the Porter quote API is wired into the backend. */
const DELIVERY_FEE = 49;

// Delivery coordinates fall back to Nagpur centre if the buyer skips location.
const NAGPUR_CENTER = [79.0882, 21.1458]; // [lng, lat]

/** Resolve the buyer's delivery coordinates, best-effort. */
const resolveDeliveryCoords = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return NAGPUR_CENTER;
    const pos = await Location.getCurrentPositionAsync({});
    return [pos.coords.longitude, pos.coords.latitude];
  } catch {
    return NAGPUR_CENTER;
  }
};

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));

  const [placing, setPlacing] = useState(false);

  const empty = cartItems.length === 0;
  const total = empty ? 0 : subtotal + DELIVERY_FEE;

  const storeCount = new Set(cartItems.map((item) => item.storeId)).size;
  const unitCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  // What the buyer is saving against MRP, when the line carries one.
  const savings = cartItems.reduce(
    (sum, item) => sum + Math.max(0, (item.mrp ?? item.price) - item.price) * item.quantity,
    0,
  );

  /**
   * Real checkout. Orders are per-vendor on the backend, so a multi-shop bag is
   * split into one POST /api/orders per store; each triggers the vendor's
   * WhatsApp alert. On success the bag is cleared and the buyer is handed to
   * live tracking for the first order placed.
   */
  const handleConfirm = async () => {
    if (!isLoggedIn) {
      Alert.alert('Sign in to order', 'Please sign in to place your order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('Auth', { mode: 'signin' }) },
      ]);
      return;
    }

    setPlacing(true);
    try {
      const coordinates = await resolveDeliveryCoords();

      // Group the bag by vendor (storeId) — one order per shop.
      const byVendor = new Map();
      for (const item of cartItems) {
        if (!item.storeId) continue;
        if (!byVendor.has(item.storeId)) byVendor.set(item.storeId, []);
        byVendor.get(item.storeId).push(item);
      }

      if (byVendor.size === 0) {
        throw new Error('These items are not linked to a shop yet — pull to refresh the storefront.');
      }

      // Turn the GPS pin into a real street address + pincode via the device's
      // free geocoder (no API key). Falls back to sensible defaults.
      let line1 = 'Current location';
      let pincode = '440001';
      try {
        const [lng, lat] = coordinates;
        const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const g = geo?.[0];
        if (g) {
          line1 = [g.name, g.street, g.district].filter(Boolean).join(', ') || line1;
          pincode = g.postalCode || pincode;
        }
      } catch {
        /* geocoder unavailable — keep defaults */
      }

      const deliveryAddress = {
        line1,
        city: 'Nagpur',
        pincode,
        location: { type: 'Point', coordinates },
      };

      const placed = [];
      for (const [vendorId, items] of byVendor) {
        const order = await placeOrder({
          vendor: vendorId,
          items: items.map((it) => ({
            product: it.productId,
            name: it.name,
            size: it.size ?? 'FREE',
            quantity: it.quantity,
            price: it.price,
          })),
          totalPrice: items.reduce((s, it) => s + it.price * it.quantity, 0) + DELIVERY_FEE,
          deliveryAddress,
          paymentMethod: 'COD',
        });
        // Keep the original cart items (they carry storeName/etaMinutes) for the
        // tracking screen, and normalise the backend id/total field names.
        placed.push({
          id: order._id,
          total: order.totalPrice,
          items,
          placedAt: order.createdAt || new Date().toISOString(),
        });
      }

      success();
      clearCart();
      navigation.navigate('LiveTracking', { order: placed[0] });
    } catch (err) {
      failure();
      Alert.alert('Could not place order', err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (empty) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          icon="shopping-bag"
          title="Your bag is empty."
          body="Nothing picked yet. The nearest shop is under a kilometre away, and the rail is already stocked."
          actionLabel="Browse nearby"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 268 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>
              {unitCount} {unitCount === 1 ? 'piece' : 'pieces'}
            </Text>
            <Text style={styles.listHeaderMeta}>
              from {storeCount} {storeCount === 1 ? 'shop' : 'shops'}
              {storeCount > 1 ? ' · delivered separately' : ''}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <CartLine
            item={item}
            index={index}
            onIncrement={() => {
              selection();
              // addToCart keys a line off `product.id`; a cart line carries the
              // product under `productId`, so it has to be mapped back or the
              // line key comes out as "undefined::SIZE" and the tap appends a
              // duplicate row rather than incrementing this one.
              addToCart({ ...item, id: item.productId }, item.size);
            }}
            onDecrement={() => {
              selection();
              removeFromCart(item.key);
            }}
            onRemove={() => removeFromCart(item.key, { all: true })}
          />
        )}
      />

      {/* Docked summary. */}
      <View style={[styles.summary, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Gradient fill preset="chrome" />
        <View pointerEvents="none" style={styles.summaryHighlight} />

        <SummaryRow label="Subtotal" value={formatINR(subtotal)} />
        <SummaryRow label="Delivery (Porter)" value={formatINR(DELIVERY_FEE)} icon="truck" />
        {savings > 0 ? (
          <SummaryRow label="You save" value={`− ${formatINR(savings)}`} tone="jade" />
        ) : null}

        <View style={styles.summaryDivider} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalMeta}>Cash on delivery</Text>
          </View>
          <AnimatedNumber value={total} format={formatINR} style={styles.totalValue} />
        </View>

        <Button
          label="Place order"
          icon="check-circle"
          onPress={handleConfirm}
          loading={placing}
          size="lg"
          fullWidth
          caption={`${formatINR(total)}  ·  pay the rider on delivery`}
          accessibilityHint="Sends your order to the shop and books a rider"
        />
      </View>
    </View>
  );
}

/**
 * One line in the bag.
 *
 * Removal exits to the right rather than fading in place, and the lines below
 * close the gap with a layout transition — so the bag visibly *shrinks* by one
 * item, which is the confirmation the tap deserves. A row that simply vanished
 * would leave the buyer checking whether they had removed the right thing.
 */
function CartLine({ item, index, onIncrement, onDecrement, onRemove }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index)).duration(duration.slow).easing(easing.out)}
      exiting={FadeOutRight.duration(duration.base)}
      layout={LinearTransition.duration(duration.base)}
      style={styles.lineWrap}
    >
      <Surface padding="compact" lift="low">
        <View style={styles.line}>
          <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />

          <View style={styles.lineBody}>
            <Text style={styles.lineName} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={styles.lineTags}>
              {item.size ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.size}</Text>
                </View>
              ) : null}
              {item.colorway ? (
                <Text style={styles.lineMeta} numberOfLines={1}>
                  {item.colorway}
                </Text>
              ) : null}
            </View>

            <View style={styles.storeRow}>
              <Icon name="shopping-bag" size="xs" color={colors.slate} />
              <Text style={styles.lineStore} numberOfLines={1}>
                {item.storeName}
              </Text>
            </View>

            <View style={styles.lineFooter}>
              <View style={styles.stepper}>
                <PressableScale
                  onPress={onDecrement}
                  haptic={false}
                  scaleTo={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove one ${item.name}`}
                  style={styles.stepButton}
                >
                  <Icon name="minus" size="sm" color={colors.ivory} />
                </PressableScale>

                <Text style={styles.stepCount}>{item.quantity}</Text>

                <PressableScale
                  onPress={onIncrement}
                  haptic={false}
                  scaleTo={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Add one more ${item.name}`}
                  style={styles.stepButton}
                >
                  <Icon name="plus" size="sm" color={colors.ivory} />
                </PressableScale>
              </View>

              <Text style={styles.linePrice}>{formatINR(item.price * item.quantity)}</Text>
            </View>
          </View>

          <PressableScale
            onPress={onRemove}
            haptic="medium"
            scaleTo={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name} from your bag`}
            style={styles.remove}
          >
            <Icon name="x" size="sm" color={colors.slate} />
          </PressableScale>
        </View>
      </Surface>
    </Animated.View>
  );
}

function SummaryRow({ label, value, icon, tone = 'neutral' }) {
  const tint = tone === 'jade' ? colors.jade : colors.platinum;

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLabelRow}>
        {icon ? <Icon name={icon} size="xs" color={colors.slate} /> : null}
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryValue, { color: tint }]}>{value}</Text>
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
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.sm,
  },
  listHeader: {
    marginBottom: spacing.sm,
  },
  listHeaderTitle: {
    ...type.heading,
    fontWeight: '300',
  },
  listHeaderMeta: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
  },

  lineWrap: {
    marginBottom: spacing.s,
  },
  line: {
    flexDirection: 'row',
  },
  thumb: {
    width: 78,
    height: 104,
    borderRadius: radii.sm,
    backgroundColor: colors.charcoalLight,
  },
  lineBody: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingRight: spacing.m,
  },
  lineName: {
    ...type.subheading,
    fontSize: 15,
    fontWeight: '400',
  },
  lineTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 5,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.xs,
    backgroundColor: colors.charcoalLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  tagText: {
    ...type.caption,
    color: colors.platinum,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  lineMeta: {
    ...type.caption,
    color: colors.ash,
    flexShrink: 1,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lineStore: {
    ...type.caption,
    color: colors.slate,
    flexShrink: 1,
  },
  lineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.obsidianDeep,
  },
  stepButton: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    ...type.label,
    fontSize: 13,
    letterSpacing: 0,
    minWidth: 20,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  linePrice: {
    ...type.numeric,
    fontSize: 16,
  },
  remove: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.m,
    paddingHorizontal: spacing.m,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
    overflow: 'hidden',
    ...elevation.high,
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
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryLabel: {
    ...type.bodySmall,
    color: colors.ash,
  },
  summaryValue: {
    ...type.bodySmall,
    fontVariant: ['tabular-nums'],
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  totalLabel: {
    ...type.eyebrow,
    color: colors.ash,
    letterSpacing: 2.4,
  },
  totalMeta: {
    ...type.caption,
    color: colors.slate,
    marginTop: 2,
  },
  totalValue: {
    ...type.numericLarge,
    fontSize: 28,
    lineHeight: 32,
  },
});
