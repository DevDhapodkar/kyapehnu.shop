import { useState } from 'react';
import { Image } from 'expo-image';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import BrandLogo from '../components/BrandLogo';
import PressableScale from '../components/PressableScale';
import { formatCurrency as formatINR } from '../utils/format';
import {
  selectCartItems,
  selectCartTotal,
  useCartStore,
} from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';

/**
 * CartScreen — Your Bag (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen 89b4f05e354e42bf84155cc172e1efb1:
 * - Animated drifting ambient background blobs
 * - Floating glass header: Back button & location selector
 * - Bag items list with size pills, remove & add quantity steppers, item delete
 * - Delivery address card: "Civil Lines, Nagpur · Palm Grove 402"
 * - Payment method selection: Cash on Delivery vs UPI / Card
 * - Tabular billing summary: Subtotal, Atelier Express Delivery (Free), Total
 * - Sticky bottom glass checkout action bar
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'upi'

  const cartItems = useCartStore(selectCartItems);
  const subtotal = useCartStore(selectCartTotal);
  const addToCart = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const profile = useAuthStore((state) => state.profile);

  const total = subtotal; // Express delivery is free in rapid radius
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleIncrement = (item) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    addToCart(item, item.size);
  };

  const handleDecrement = (item) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeFromCart(item.key || item.productId || item.id);
  };

  const handleRemoveLine = (item) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    removeFromCart(item.key || item.productId || item.id, { all: true });
  };

  const handleProceedToCheckout = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.navigate('Address');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Header */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <PressableScale
            onPress={() => navigation.goBack()}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={17}
              color={colors.textObsidian}
            />
          </PressableScale>

          <BrandLogo size="sm" showEmblem={true} />

          <PressableScale
            onPress={() => navigation.navigate('Address')}
            style={styles.locationPill}
            accessibilityRole="button"
            accessibilityLabel="Delivery location"
          >
            <MaterialIcons name="near-me" size={13} color={colors.accentGold} />
            <Text style={styles.locationText}>Sitabuldi, Nagpur</Text>
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Title & Eyebrow */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Your Bag</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>
                {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          </View>
          <Text style={styles.screenSubtitle}>
            45-min Atelier Express Delivery
          </Text>
        </View>

        {/* Empty State */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons
              name="shopping-bag"
              size={48}
              color={colors.accentGold}
            />
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <Text style={styles.emptySubtitle}>
              Curated garments from Sitabuldi & Dharampeth boutiques ready for
              instant delivery.
            </Text>
            <PressableScale
              onPress={() => navigation.navigate('Home')}
              style={styles.emptyCta}
            >
              <Text style={styles.emptyCtaText}>Explore Storefront</Text>
            </PressableScale>
          </View>
        ) : (
          <>
            {/* Bag Items List */}
            <View style={styles.itemsList}>
              {cartItems.map((item) => (
                <View key={item.key || `${item.productId || item.id}-${item.size}`} style={styles.itemCard}>
                  {/* Thumbnail */}
                  <View style={styles.thumbWrap}>
                    <Image
                      source={
                        typeof item.image === 'string'
                          ? { uri: item.image }
                          : item.image
                      }
                      style={styles.thumbImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.itemInfoCol}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <PressableScale
                        onPress={() => handleRemoveLine(item)}
                        style={styles.deleteBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Remove item"
                      >
                        <MaterialIcons
                          name="close"
                          size={16}
                          color={colors.textAsh}
                        />
                      </PressableScale>
                    </View>

                    <View style={styles.itemMetaRow}>
                      <Text style={styles.itemMeta}>Size {item.size || 'Free'}</Text>
                      {item.color ? (
                        <View style={styles.itemColorBadge}>
                          {item.colorHex ? (
                            <View
                              style={[
                                styles.itemColorDot,
                                { backgroundColor: item.colorHex },
                              ]}
                            />
                          ) : null}
                          <Text style={styles.itemColorText}>{item.color}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.itemMetaDot}>·</Text>
                      <Text style={styles.itemMetaStore} numberOfLines={1}>
                        {item.storeName || 'Atelier'}
                      </Text>
                    </View>

                    <View style={styles.itemBottomRow}>
                      <Text style={styles.itemPrice}>
                        {formatINR(item.price * item.quantity)}
                      </Text>

                      {/* Stepper Controls */}
                      <View style={styles.stepperWrap}>
                        <PressableScale
                          onPress={() => handleDecrement(item)}
                          style={styles.stepperBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease quantity"
                        >
                          <MaterialIcons
                            name="remove"
                            size={14}
                            color={colors.textObsidian}
                          />
                        </PressableScale>

                        <Text style={styles.quantityText}>{item.quantity}</Text>

                        <PressableScale
                          onPress={() => handleIncrement(item)}
                          style={styles.stepperBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Increase quantity"
                        >
                          <MaterialIcons
                            name="add"
                            size={14}
                            color={colors.textObsidian}
                          />
                        </PressableScale>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Delivery Destination Card */}
            <PressableScale
              onPress={() => navigation.navigate('Address')}
              style={styles.addressCard}
              accessibilityRole="button"
              accessibilityLabel="Delivery Address"
            >
              <View style={styles.addressIconWrap}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={profile?.savedAddresses?.length ? colors.accentGold : colors.accentCrimson}
                />
              </View>
              <View style={styles.addressInfoCol}>
                <Text style={styles.addressLabel}>DELIVERY ADDRESS</Text>
                <Text style={styles.addressText} numberOfLines={1}>
                  {profile?.savedAddresses?.length
                    ? `${profile.savedAddresses[0].line1}, ${profile.savedAddresses[0].city || 'Nagpur'}`
                    : 'No address set · Tap to set doorstep'}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={colors.textAsh}
              />
            </PressableScale>

            {/* Payment Method Selector */}
            <View style={styles.glassCard}>
              <Text style={styles.cardHeaderTitle}>Payment Preference</Text>
              <View style={styles.paymentMethodsRow}>
                <PressableScale
                  onPress={() => setPaymentMethod('cod')}
                  style={[
                    styles.paymentOptionBtn,
                    paymentMethod === 'cod'
                      ? styles.paymentOptionActive
                      : styles.paymentOptionInactive,
                  ]}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={17}
                    color={
                      paymentMethod === 'cod'
                        ? colors.accentCrimson
                        : colors.textAsh
                    }
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === 'cod' && styles.paymentTextActive,
                    ]}
                  >
                    Cash on Delivery
                  </Text>
                </PressableScale>

                <PressableScale
                  onPress={() => setPaymentMethod('upi')}
                  style={[
                    styles.paymentOptionBtn,
                    paymentMethod === 'upi'
                      ? styles.paymentOptionActive
                      : styles.paymentOptionInactive,
                  ]}
                >
                  <MaterialIcons
                    name="credit-card"
                    size={17}
                    color={
                      paymentMethod === 'upi'
                        ? colors.accentCrimson
                        : colors.textAsh
                    }
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      paymentMethod === 'upi' && styles.paymentTextActive,
                    ]}
                  >
                    UPI / Card
                  </Text>
                </PressableScale>
              </View>
            </View>

            {/* Billing Summary Breakdown */}
            <View style={styles.glassCard}>
              <Text style={styles.cardHeaderTitle}>Price Breakdown</Text>
              <View style={styles.billRows}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal</Text>
                  <Text style={styles.billValue}>{formatINR(subtotal)}</Text>
                </View>

                <View style={styles.billRow}>
                  <View style={styles.expressTagRow}>
                    <Text style={styles.billLabel}>Express Delivery</Text>
                    <View style={styles.rapidBadge}>
                      <Text style={styles.rapidBadgeText}>45 MIN</Text>
                    </View>
                  </View>
                  <Text style={styles.freeText}>FREE</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.billRow}>
                  <Text style={styles.totalBillLabel}>Total</Text>
                  <Text style={styles.totalBillValue}>{formatINR(total)}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 4. Sticky Bottom Checkout Bar */}
      {cartItems.length > 0 ? (
        <View
          style={[
            styles.bottomBarWrap,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.bottomBar}>
            <View style={styles.priceCol}>
              <Text style={styles.toPayLabel}>TO PAY</Text>
              <Text style={styles.toPayPrice}>{formatINR(total)}</Text>
            </View>

            <PressableScale
              onPress={handleProceedToCheckout}
              style={styles.checkoutBtn}
              accessibilityRole="button"
              accessibilityLabel="Proceed to Checkout"
            >
              <Text style={styles.checkoutLabel}>PROCEED TO CHECKOUT</Text>
              <MaterialIcons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
              />
            </PressableScale>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
  },
  topBarInner: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  topBarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  locationText: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm + 2,
  },
  titleSection: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    color: colors.textObsidian,
    fontSize: 26,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  itemCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  itemCountText: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '700',
  },
  screenSubtitle: {
    color: colors.textSlate,
    fontSize: 12.5,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    marginTop: spacing.lg,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  emptyTitle: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSlate,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xs,
    maxWidth: 260,
  },
  emptyCta: {
    backgroundColor: colors.textObsidian,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: spacing.md,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  itemsList: {
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  thumbWrap: {
    width: 76,
    height: 96,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  itemInfoCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    color: colors.textObsidian,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 6,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    color: colors.textAsh,
    fontSize: 11,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  itemColorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  itemColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  itemColorText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textObsidian,
  },
  itemMetaDot: {
    color: colors.textAsh,
    fontSize: 10,
  },
  itemMetaStore: {
    color: colors.textAsh,
    fontSize: 11,
    maxWidth: 120,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  itemPrice: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '700',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  stepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: colors.textObsidian,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfoCol: {
    flex: 1,
  },
  addressLabel: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addressText: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  cardHeaderTitle: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  paymentOptionActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: colors.accentCrimson,
  },
  paymentOptionInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  paymentOptionText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSlate,
  },
  paymentTextActive: {
    color: colors.textObsidian,
    fontWeight: '700',
  },
  billRows: {
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billLabel: {
    color: colors.textSlate,
    fontSize: 12.5,
  },
  billValue: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '600',
  },
  expressTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rapidBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: radii.sm,
  },
  rapidBadgeText: {
    color: colors.accentGoldDeep,
    fontSize: 8.5,
    fontWeight: '700',
  },
  freeText: {
    color: colors.accentGoldDeep,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 4,
  },
  totalBillLabel: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  totalBillValue: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '700',
  },
  bottomBarWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    zIndex: 50,
  },
  bottomBar: {
    height: 64,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(36px) saturate(210%)',
        WebkitBackdropFilter: 'blur(36px) saturate(210%)',
      },
    }),
  },
  priceCol: {
    gap: 1,
  },
  toPayLabel: {
    color: colors.textAsh,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  toPayPrice: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '700',
  },
  checkoutBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  checkoutLabel: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
