import { useState } from 'react';
import { Image } from 'expo-image';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import {
  Chip,
  EmptyState,
  GlassHeader,
  GLASS_HEADER_HEIGHT,
  IconButton,
  PillButton,
  SectionHeader,
  Stepper,
  Surface,
} from '../components/ui';
import { formatINR } from '../data/mockStores';
import { selectCartItems, selectCartTotal, useCartStore } from '../store/useCartStore';
import { placeOrder } from '../api/vendorApi';
import useAuthStore from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

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

/**
 * CartScreen
 *
 * The bag as a stack of bento rows with the money docked at the foot. The
 * summary panel floats over the list rather than sitting after it, so the total
 * and the commit are visible from the first line item down — a buyer never has
 * to scroll to find out what they are about to pay.
 */
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
  const shopCount = new Set(cartItems.map((item) => item.storeId)).size;

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
        throw new Error(
          'These items are not linked to a shop yet — pull to refresh the storefront.'
        );
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

      clearCart();
      navigation.navigate('LiveTracking', { order: placed[0] });
    } catch (err) {
      Alert.alert('Could not place order', err.message);
    } finally {
      setPlacing(false);
    }
  };

  const header = (
    <GlassHeader title="Your Bag" onBack={() => navigation.goBack()} />
  );

  if (empty) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          glyph="◇"
          title="Your bag is empty."
          body="Nothing picked yet. The nearest shop is under a kilometre away."
          actionLabel="Browse nearby"
          onAction={() => navigation.navigate('Home')}
        />
        {header}
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
          {
            paddingTop: insets.top + GLASS_HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + 300,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SectionHeader
            eyebrow="Ready to order"
            title={`${cartItems.length} ${cartItems.length === 1 ? 'piece' : 'pieces'}`}
            caption={`From ${shopCount} ${shopCount === 1 ? 'shop' : 'shops'} — each one gets its own rider.`}
            style={styles.listHeader}
          />
        }
        renderItem={({ item }) => (
          <Surface tone="thin" radius={radii.lg} elevation="low" style={styles.line}>
            <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />

            <View style={styles.lineBody}>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.name}
              </Text>

              <View style={styles.lineChips}>
                {item.size ? <Chip label={item.size} size="sm" tone="thin" /> : null}
                {item.colorway ? <Chip label={item.colorway} size="sm" tone="thin" /> : null}
              </View>

              <Text style={styles.lineStore} numberOfLines={1}>
                {item.storeName}
              </Text>

              <View style={styles.lineFooter}>
                <Stepper
                  value={item.quantity}
                  label={item.name}
                  onDecrement={() => removeFromCart(item.key)}
                  onIncrement={() => addToCart(item, item.size)}
                />
                <Text style={styles.linePrice}>{formatINR(item.price * item.quantity)}</Text>
              </View>
            </View>

            <IconButton
              glyph="×"
              tone="clear"
              size={30}
              glyphSize={18}
              onPress={() => removeFromCart(item.key, { all: true })}
              accessibilityLabel={`Remove ${item.name} from bag`}
              style={styles.remove}
            />
          </Surface>
        )}
      />

      {header}

      {/* Docked summary. */}
      <View
        style={[styles.summaryDock, { paddingBottom: insets.bottom + spacing.sm }]}
        pointerEvents="box-none"
      >
        <Surface tone="thick" radius={radii.xl} elevation="high" style={styles.summary} sheen>
          <SummaryRow label="Subtotal" value={formatINR(subtotal)} />
          <SummaryRow label="Delivery (Porter)" value={formatINR(DELIVERY_FEE)} />
          <SummaryRow label="Payment" value="Cash on Delivery" />

          <View style={styles.summaryDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatINR(total)}</Text>
          </View>

          <PillButton
            label="Place order"
            variant="gradient"
            size="lg"
            icon="→"
            caption={`${formatINR(total)}  ·  pay on delivery`}
            onPress={handleConfirm}
            loading={placing}
            full
          />
        </Surface>
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
    backgroundColor: colors.transparent,
  },
  emptyRoot: {
    flex: 1,
    backgroundColor: colors.transparent,
    justifyContent: 'center',
  },

  listContent: {
    paddingHorizontal: spacing.md,
  },
  listHeader: {
    marginBottom: spacing.md,
  },

  line: {
    flexDirection: 'row',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 84,
    height: 108,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
  },
  lineBody: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingRight: spacing.md,
  },
  lineName: {
    ...typography.h3,
    color: colors.ivory,
  },
  lineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginTop: 6,
  },
  lineStore: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
    marginTop: 5,
  },
  lineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  linePrice: {
    ...typography.numeric,
    fontSize: 16,
    color: colors.ivory,
  },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },

  summaryDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  summary: {
    paddingHorizontal: spacing.md - 2,
    paddingTop: spacing.md - 2,
    paddingBottom: spacing.sm + 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.ash,
  },
  summaryValue: {
    ...typography.caption,
    color: colors.platinum,
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
    marginBottom: spacing.sm + 2,
  },
  totalLabel: {
    ...typography.eyebrow,
    color: colors.ash,
  },
  totalValue: {
    ...typography.numericLg,
    fontSize: 28,
    color: colors.ivory,
  },
});
