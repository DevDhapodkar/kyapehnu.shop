import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import PressableScale from '../../components/PressableScale';
import { fetchOrder } from '../../api/vendorApi';
import { formatCurrency as formatINR, shortOrderId } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { useVendorStore, selectOrderById } from '../../store/useVendorStore';

/**
 * VendorOrderDetailScreen — Fulfillment Sheet (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen da3ec7deae4e432e97b98f5e68a885c7:
 * - Animated drifting ambient background blobs
 * - Frosted glass top navigation bar with order ID
 * - Priority trial status banner with atelier hub timestamp
 * - 4-stage fulfillment lifecycle stepper: Placed -> Packing -> Porter -> Delivered
 * - Customer VIP profile card with address & distance details
 * - Garment QC verification checklist
 * - Action CTA: Accept / Pack / Dispatch Porter
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function VendorOrderDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params || {};

  const storeOrder = useVendorStore(selectOrderById(orderId));
  const pendingOrderId = useVendorStore((state) => state.pendingOrderId);
  const acceptOrder = useVendorStore((state) => state.acceptOrder);
  const advanceStatus = useVendorStore((state) => state.advanceStatus);
  const markOrderReady = useVendorStore((state) => state.markOrderReady);

  const [fetched, setFetched] = useState(null);

  const order = storeOrder ?? fetched;
  const busy = pendingOrderId === orderId;

  useEffect(() => {
    if (storeOrder || fetched) return;
    let isMounted = true;
    fetchOrder(orderId)
      .then((data) => {
        if (isMounted) setFetched(data);
      })
      .catch((err) => console.log('Order fetch:', err.message));
    return () => {
      isMounted = false;
    };
  }, [orderId, storeOrder, fetched]);

  const currentStatus = (order?.status || 'PENDING').toUpperCase();

  const advanceLabel =
    currentStatus === 'PENDING'
      ? '✓ Sweekar Karein (Accept)'
      : currentStatus === 'ACCEPTED'
      ? '📦 Pack Ho Gaya (Mark Packed)'
      : currentStatus === 'PACKED'
      ? '🛵 Porter Bulayein (Dispatch)'
      : currentStatus === 'READY_FOR_PICKUP'
      ? '🤝 Rider Ko Diya (Handover)'
      : currentStatus === 'IN_TRANSIT'
      ? '✓ Delivered (Mil Gaya)'
      : currentStatus === 'DELIVERED'
      ? '✓ Order Complete'
      : 'Order Cancelled';

  const isFinal = ['DELIVERED', 'CANCELLED'].includes(currentStatus);
  const isAcceptedOrBeyond = ['ACCEPTED', 'PACKED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(currentStatus);
  const isPackedOrBeyond = ['PACKED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(currentStatus);
  const isReadyOrBeyond = ['READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(currentStatus);
  const isDelivered = currentStatus === 'DELIVERED';

  const displayOrder = order
    ? {
        _id: order._id,
        orderId: String(order._id).slice(-6).toUpperCase(),
        status: currentStatus,
        customerName:
          order.customer?.name ||
          order.guestContact?.name ||
          order.deliveryAddress?.receiverName ||
          'Customer',
        customerPhone:
          order.customer?.phone ||
          order.guestContact?.phone ||
          order.deliveryAddress?.receiverPhone ||
          '—',
        customerAddress: [order.deliveryAddress?.line1, order.deliveryAddress?.line2]
          .filter(Boolean)
          .join(', ') || 'Address pending',
        distanceKm: typeof order.distanceKm === 'number' ? order.distanceKm : null,
        items: order.items || [],
        total: order.totalPrice || 0,
        placedAt: order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recent',
        porter: order.porter,
      }
    : null;

  const handleAdvance = async () => {
    if (!order?._id) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      if (currentStatus === 'PENDING') {
        const updated = await acceptOrder(order._id);
        if (updated) setFetched(updated);
        Alert.alert('Order Sweekar Ho Gaya', 'Order accept ho gaya hai. Kripya kapde pack karein.');
      } else if (currentStatus === 'ACCEPTED') {
        const updated = await advanceStatus(order._id, 'PACKED');
        if (updated) setFetched(updated);
        Alert.alert('Kapda Pack Ho Gaya', 'Kapda pack ho gaya hai. Ab Porter rider bulane ke liye yahan dabayein.');
      } else if (currentStatus === 'PACKED') {
        const res = await markOrderReady(order._id);
        if (res?.order) setFetched(res.order);
        Alert.alert('Porter Rider Bulaya Gaya', 'Porter rider aapki dukan par parcel lene ke liye nikal chuka hai.');
      } else if (currentStatus === 'READY_FOR_PICKUP') {
        const updated = await advanceStatus(order._id, 'IN_TRANSIT');
        if (updated) setFetched(updated);
        Alert.alert('Rider Ko Diya Gaya', 'Order doorstep trial ke liye nikal chuka hai.');
      } else if (currentStatus === 'IN_TRANSIT') {
        const updated = await advanceStatus(order._id, 'DELIVERED');
        if (updated) setFetched(updated);
        Alert.alert('Order Complete', 'Order grahak tak pahunch gaya hai.');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Order update nahi ho saka.');
    }
  };

  const handleDeclineOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await advanceStatus(order._id, 'CANCELLED', 'Cancelled by atelier');
              if (updated) setFetched(updated);
              Alert.alert('Order Cancelled', 'The customer has been notified.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel order.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Top Bar */}
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

          <Text style={styles.headerTitle}>
            Order #{shortOrderId(displayOrder.orderId || orderId)}
          </Text>

          <PressableScale
            onPress={() =>
              Alert.alert('Fulfillment Options', 'Print invoice or contact support.')
            }
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Options"
          >
            <MaterialIcons
              name="more-horiz"
              size={18}
              color={colors.textObsidian}
            />
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
        {/* Priority Status Banner */}
        <View style={styles.priorityCard}>
          <View style={styles.priorityTopRow}>
            <View style={styles.priorityBadge}>
              <MaterialIcons
                name="hourglass-top"
                size={14}
                color={colors.accentCrimson}
              />
              <Text style={styles.priorityBadgeText}>
                {isPackedOrBeyond
                  ? isReadyOrBeyond
                    ? 'Porter En Route'
                    : 'Ready for Pickup'
                  : isAcceptedOrBeyond
                  ? 'Packing in Progress'
                  : 'New Order'}
              </Text>
            </View>
            <Text style={styles.priorityTag}>Priority 60-Min Trial</Text>
          </View>

          <Text style={styles.orderNumber}>
            Order #{displayOrder.orderId || displayOrder._id || displayOrder.id || 'Active'}
          </Text>
          <Text style={styles.placedTimestamp}>{displayOrder.placedAt}</Text>
        </View>

        {/* 4-Step Lifecycle Progress Bar */}
        <View style={styles.stepperCard}>
          <View style={styles.stepItem}>
            <View style={styles.stepCircleDone}>
              <MaterialIcons name="check" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.stepLabel}>Placed</Text>
          </View>

          <View style={styles.stepLineDone} />

          <View style={styles.stepItem}>
            <View
              style={
                isPackedOrBeyond ? styles.stepCircleDone : isAcceptedOrBeyond ? styles.stepCircleActive : styles.stepCirclePending
              }
            >
              <MaterialIcons
                name="inventory-2"
                size={12}
                color={isPackedOrBeyond ? '#FFFFFF' : isAcceptedOrBeyond ? colors.accentCrimson : colors.textAsh}
              />
            </View>
            <Text
              style={isAcceptedOrBeyond ? styles.stepLabelActive : styles.stepLabel}
            >
              Packing
            </Text>
          </View>

          <View
            style={isPackedOrBeyond ? styles.stepLineDone : styles.stepLinePending}
          />

          <View style={styles.stepItem}>
            <View
              style={
                isReadyOrBeyond ? styles.stepCircleDone : isPackedOrBeyond ? styles.stepCircleActive : styles.stepCirclePending
              }
            >
              <MaterialIcons
                name="two-wheeler"
                size={12}
                color={isReadyOrBeyond ? '#FFFFFF' : isPackedOrBeyond ? colors.accentCrimson : colors.textAsh}
              />
            </View>
            <Text style={isPackedOrBeyond ? styles.stepLabelActive : styles.stepLabel}>Porter</Text>
          </View>

          <View style={isReadyOrBeyond ? styles.stepLineDone : styles.stepLinePending} />

          <View style={styles.stepItem}>
            <View style={isDelivered ? styles.stepCircleDone : styles.stepCirclePending}>
              <MaterialIcons
                name="cottage"
                size={12}
                color={isDelivered ? '#FFFFFF' : colors.textAsh}
              />
            </View>
            <Text style={isDelivered ? styles.stepLabelActive : styles.stepLabel}>Delivered</Text>
          </View>
        </View>

        {/* Customer VIP Profile Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.customerIdentityRow}>
              <View style={styles.customerAvatar}>
                <MaterialIcons
                  name="person"
                  size={16}
                  color={colors.textObsidian}
                />
              </View>
              <View>
                <Text style={styles.customerName}>
                  {displayOrder.customerName}
                </Text>
                <Text style={styles.customerTier}>
                  Ivory Concierge Patron · VIP Trial
                </Text>
              </View>
            </View>

            <PressableScale
              onPress={() =>
                Linking.openURL(`tel:${displayOrder.customerPhone}`).catch(() => {})
              }
              style={styles.callCustomerBtn}
              accessibilityRole="button"
              accessibilityLabel="Call customer"
            >
              <MaterialIcons name="call" size={15} color={colors.accentGold} />
            </PressableScale>
          </View>

          {/* Delivery Address */}
          <View style={styles.addressRow}>
            <MaterialIcons
              name="location-on"
              size={18}
              color={colors.accentGold}
            />
            <View style={styles.addressTextCol}>
              <Text style={styles.addressText}>
                {displayOrder.customerAddress}
              </Text>
              <Text style={styles.distanceText}>
                {displayOrder.distanceKm != null
                  ? `${displayOrder.distanceKm} km away`
                  : 'Distance pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Garment Details & QC Checklist */}
        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>Garment Particulars</Text>

          {displayOrder.items?.map((it, idx) => (
            <View key={idx} style={styles.garmentRow}>
              <View style={styles.garmentInfo}>
                <Text style={styles.garmentName}>{it.name}</Text>
                <Text style={styles.garmentMeta}>
                  Size {it.size} · {it.colorway || 'Atelier Weave'}
                </Text>
              </View>
              <Text style={styles.garmentPrice}>{formatINR(it.price)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Atelier QC Checklist */}
          <Text style={styles.qcTitle}>Atelier Inspection Checklist</Text>

          <View style={styles.qcItem}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={colors.accentGold}
            />
            <Text style={styles.qcText}>
              Hand-embroidery & dabka edging inspected
            </Text>
          </View>

          <View style={styles.qcItem}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={colors.accentGold}
            />
            <Text style={styles.qcText}>
              Fragranced & placed in atelier muslin garment bag
            </Text>
          </View>

          <View style={styles.qcItem}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={colors.accentGold}
            />
            <Text style={styles.qcText}>
              Doorstep alteration fit tape attached
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 4. Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBarWrap,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.bottomBar}>
          <View style={styles.priceCol}>
            <Text style={styles.orderTotalLabel}>ORDER VALUE</Text>
            <Text style={styles.orderTotalValue}>
              {formatINR(displayOrder.total)}
            </Text>
          </View>

          {currentStatus === 'PENDING' && (
            <PressableScale
              onPress={handleDeclineOrder}
              disabled={busy}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: radii.md,
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(211, 47, 47, 0.3)',
                marginRight: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel="Decline Order"
            >
              <Text style={{ color: '#D32F2F', fontWeight: '800', fontSize: 13 }}>✕ Cancel Karein</Text>
            </PressableScale>
          )}

          <PressableScale
            onPress={handleAdvance}
            disabled={busy || isFinal}
            style={[styles.advanceBtn, isFinal && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Advance Order"
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.advanceLabel}>{advanceLabel}</Text>
                {!isFinal && (
                  <MaterialIcons
                    name="arrow-forward"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </>
            )}
          </PressableScale>
        </View>
      </View>
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
  headerTitle: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm + 2,
  },
  priorityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
    gap: 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  priorityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  priorityBadgeText: {
    color: colors.accentCrimson,
    fontSize: 10,
    fontWeight: '700',
  },
  priorityTag: {
    color: colors.accentGoldDeep,
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orderNumber: {
    color: colors.textObsidian,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  placedTimestamp: {
    color: colors.textAsh,
    fontSize: 11,
  },
  stepperCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircleDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textObsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(196, 36, 58, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclePending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    color: colors.textSlate,
    fontSize: 9.5,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '700',
  },
  stepLineDone: {
    flex: 1,
    height: 2,
    backgroundColor: colors.textObsidian,
    marginHorizontal: 2,
    marginTop: -16,
  },
  stepLinePending: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 2,
    marginTop: -16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    gap: spacing.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(18, 18, 20, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    color: colors.textObsidian,
    fontSize: 14.5,
    fontWeight: '700',
  },
  customerTier: {
    color: colors.accentGoldDeep,
    fontSize: 10,
    fontWeight: '600',
  },
  callCustomerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  addressTextCol: {
    flex: 1,
  },
  addressText: {
    color: colors.textObsidian,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  distanceText: {
    color: colors.accentGoldDeep,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 3,
  },
  cardTitle: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  garmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  garmentInfo: {
    flex: 1,
  },
  garmentName: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '600',
  },
  garmentMeta: {
    color: colors.textAsh,
    fontSize: 11,
    marginTop: 1,
  },
  garmentPrice: {
    color: colors.textObsidian,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 4,
  },
  qcTitle: {
    color: colors.textObsidian,
    fontSize: 12,
    fontWeight: '700',
  },
  qcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qcText: {
    color: colors.textSlate,
    fontSize: 11.5,
    flex: 1,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    zIndex: 50,
  },
  bottomBar: {
    height: 62,
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
  orderTotalLabel: {
    color: colors.textAsh,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  orderTotalValue: {
    color: colors.textObsidian,
    fontSize: 17,
    fontWeight: '700',
  },
  advanceBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  advanceLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
