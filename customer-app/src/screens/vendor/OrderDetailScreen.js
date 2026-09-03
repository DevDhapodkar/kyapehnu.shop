import { useCallback, useEffect, useState } from 'react';
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
import { formatINR } from '../../data/mockStores';
import { colors, radii, spacing } from '../../theme/colors';
import useVendorStore, { selectOrderById } from '../../store/useVendorStore';
import { shortOrderId } from '../../utils/format';

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
  const markOrderReady = useVendorStore((state) => state.markOrderReady);

  const [fetched, setFetched] = useState(null);
  const [packedStage, setPackedStage] = useState(false);

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

  const displayOrder = order || {
    _id: orderId || 'mock-kp-8902',
    orderId: 'KP-8902',
    status: packedStage ? 'dispatched' : 'accepted',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 98230 44102',
    customerAddress:
      'Bungalow 4, Palm Road, Near High Court, Civil Lines, Nagpur · 440001',
    distanceKm: 2.8,
    items: [
      {
        name: 'Handwoven Chanderi Angrakha',
        size: 'S',
        price: 4800,
        colorway: 'Ivory Silk',
      },
    ],
    total: 4800,
    placedAt: '14:02 IST · Dharampeth Atelier Hub',
  };

  const handleAdvance = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (!packedStage) {
      setPackedStage(true);
      if (acceptOrder) {
        try {
          await acceptOrder(orderId);
        } catch (_e) {
          // ignore
        }
      }
      Alert.alert(
        'Order Packed',
        'Porter driver Rameshwar T. has been alerted for atelier pickup. ETA: 6m.'
      );
    } else {
      if (markOrderReady) {
        try {
          await markOrderReady(orderId);
        } catch (_e) {
          // ignore
        }
      }
      Alert.alert('Dispatched', 'Handed over to Porter rider. Live tracking active.');
      navigation.goBack();
    }
  }, [packedStage, acceptOrder, markOrderReady, orderId, navigation]);

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
                {packedStage ? 'Porter En Route' : 'Awaiting Packing'}
              </Text>
            </View>
            <Text style={styles.priorityTag}>Priority 60-Min Trial</Text>
          </View>

          <Text style={styles.orderNumber}>
            Order #{displayOrder.orderId || 'KP-8902'}
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
                packedStage ? styles.stepCircleDone : styles.stepCircleActive
              }
            >
              <MaterialIcons
                name="inventory-2"
                size={12}
                color={packedStage ? '#FFFFFF' : colors.accentCrimson}
              />
            </View>
            <Text
              style={packedStage ? styles.stepLabel : styles.stepLabelActive}
            >
              Packing
            </Text>
          </View>

          <View
            style={packedStage ? styles.stepLineDone : styles.stepLinePending}
          />

          <View style={styles.stepItem}>
            <View
              style={
                packedStage ? styles.stepCircleActive : styles.stepCirclePending
              }
            >
              <MaterialIcons
                name="two-wheeler"
                size={12}
                color={packedStage ? colors.accentCrimson : colors.textAsh}
              />
            </View>
            <Text style={styles.stepLabel}>Porter</Text>
          </View>

          <View style={styles.stepLinePending} />

          <View style={styles.stepItem}>
            <View style={styles.stepCirclePending}>
              <MaterialIcons
                name="cottage"
                size={12}
                color={colors.textAsh}
              />
            </View>
            <Text style={styles.stepLabel}>Delivered</Text>
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
                {displayOrder.distanceKm} km away · 14m estimated bike corridor
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

          <PressableScale
            onPress={handleAdvance}
            disabled={busy}
            style={styles.advanceBtn}
            accessibilityRole="button"
            accessibilityLabel="Advance Order"
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.advanceLabel}>
                  {packedStage
                    ? 'Hand Over to Porter'
                    : 'Mark Packed · Request Porter'}
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={16}
                  color="#FFFFFF"
                />
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
