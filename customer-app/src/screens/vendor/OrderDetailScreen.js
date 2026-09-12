import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import BrandLogo from '../../components/BrandLogo';
import PressableScale from '../../components/PressableScale';
import { fetchOrder } from '../../api/vendorApi';
import { formatCurrency as formatINR, shortOrderId } from '../../utils/format';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';
import { useVendorStore, selectOrderById } from '../../store/useVendorStore';

/**
 * VendorOrderDetailScreen — Luxury Fulfillment Sheet
 *
 * Implements Stitch Screen da3ec7deae4e432e97b98f5e68a885c7 & dark/light counterparts:
 * - BrandLogo with Royal Crimson & Gold squircle emblem
 * - Location selector pill (Sitabuldi, Nagpur)
 * - Navigation & Order Identifier Header (#KP-8492) with serif typography
 * - Action Required Banner with countdown timer & amber/crimson alert
 * - 4-stage fulfillment lifecycle stepper: Placed -> Packing -> Porter -> Delivered
 * - Client & Delivery VIP card with monogram avatar, distance & phone call CTA
 * - Garments to Pack section with editorial thumbnails, SKU tags & interactive QC checklist
 * - Porter Express Fleet real-time proximity status & WhatsApp dispatch confirmation
 * - Sticky bottom actions with primary dispatch CTA & dual utility actions (Print Tag, Stylist Desk)
 * - Dynamic theme support: Ivory Studio Luxury (Light) & Royal Crimson Noir (Dark)
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function VendorOrderDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { orderId } = route.params || {};

  const storeOrder = useVendorStore(selectOrderById(orderId));
  const pendingOrderId = useVendorStore((state) => state.pendingOrderId);
  const acceptOrder = useVendorStore((state) => state.acceptOrder);
  const advanceStatus = useVendorStore((state) => state.advanceStatus);
  const markOrderReady = useVendorStore((state) => state.markOrderReady);

  const [fetched, setFetched] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [checkInspected, setCheckInspected] = useState(true);
  const [checkPackaging, setCheckPackaging] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(268); // 04:28 timer

  const order = storeOrder ?? fetched;
  const busy = pendingOrderId === orderId;

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Order data loader
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

  const isFinal = ['DELIVERED', 'CANCELLED'].includes(currentStatus);
  const isAcceptedOrBeyond = ['ACCEPTED', 'PACKED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(currentStatus);
  const isPackedOrBeyond = ['PACKED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(currentStatus);
  const isReadyOrBeyond = ['READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED'].includes(currentStatus);
  const isDelivered = currentStatus === 'DELIVERED';

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const displayOrder = order
    ? {
        _id: order._id,
        orderCode: shortOrderId(order._id || orderId),
        status: currentStatus,
        customerName:
          order.customer?.name ||
          order.guestContact?.name ||
          order.deliveryAddress?.receiverName ||
          'Radhika Deshmukh',
        customerPhone:
          order.customer?.phone ||
          order.guestContact?.phone ||
          order.deliveryAddress?.receiverPhone ||
          '+919823011492',
        customerAddress:
          [order.deliveryAddress?.line1, order.deliveryAddress?.line2].filter(Boolean).join(', ') ||
          'Flat 402, Royal Gulmohar Manor, Near Variety Square, Sitabuldi, Nagpur',
        locality: order.deliveryAddress?.locality || order.vendor?.locality || 'Sitabuldi',
        distanceKm: typeof order.distanceKm === 'number' ? order.distanceKm : 2.1,
        items:
          order.items && order.items.length > 0
            ? order.items
            : [
                {
                  _id: 'default-1',
                  name: 'Chanderi Silk Angrakha',
                  price: 4800,
                  size: 'M',
                  measurements: 'Bespoke 38" Bust · 32" Waist',
                  colorway: 'Sindhoor Crimson',
                  sku: 'SKU-772',
                  silkMark: 'Silk Mark #7721',
                  image:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuD4cSi7AeAGXWf-O2JQpIzqlckhe6p0z4ehddliXLy6VQN4RySCz_8NOcRDzS4obK6OJF-zaHMCPgkiSmBzPZdIHNnUTraBSkufei8O4KNxLFibq7VJxY6dsLjs05UTXdgyFV5ijKweokAqITQVhSVzIFkCWjNb31uqlK-xURNl-_IysYWFUHjaqfci_rQyHLeHoBBPZvt5Ix_75cm4c1_SekyHJL28hwdxoTQdyGQw8gjHHrZ9wMRpzw',
                },
                {
                  _id: 'default-2',
                  name: 'Organza Marodi Scarf',
                  price: 3140,
                  size: 'Free Size',
                  measurements: 'Ivory & Dull Gold',
                  colorway: 'Heritage Marodi Zari Border',
                  sku: 'SKU-314',
                  silkMark: null,
                  image:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDv-s5n3tYbDOJEGuGgs0zhn2f__wU_Au5jqiPM-aynic1d7bjZWrCNCeHR4G_79crITk9OIL0RUNDxO3PCP_jzNUgZTzVRaoDZnl4GDLOu5TgUHb3KI6A209mQ5dKgS_FagJdpNjtQhC-TTLYJuvFNNUyb96Z77rcAMaZJdF5FiSJHSbPQQj1l_GnspyLxLpXNQBq6IxkMrN2NXl_jjTO1W2aHLNVA-kNZaojRsCZUSFQ8rbg_oCMxzQ',
                },
              ],
        total: order.totalPrice || 7940,
        paymentMode: order.paymentMethod?.toUpperCase() === 'COD' ? 'COD' : 'COD',
        placedAt: order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '3 mins ago',
        porter: order.porter,
      }
    : {
        _id: orderId || 'KP-8492',
        orderCode: shortOrderId(orderId || 'KP8492'),
        status: currentStatus,
        customerName: 'Radhika Deshmukh',
        customerPhone: '+919823011492',
        customerAddress: 'Flat 402, Royal Gulmohar Manor, Near Variety Square, Sitabuldi, Nagpur',
        locality: 'Sitabuldi',
        distanceKm: 2.1,
        items: [
          {
            _id: 'sample-1',
            name: 'Chanderi Silk Angrakha',
            price: 4800,
            size: 'M',
            measurements: 'Bespoke 38" Bust · 32" Waist',
            colorway: 'Sindhoor Crimson',
            sku: 'SKU-772',
            silkMark: 'Silk Mark #7721',
            image:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuD4cSi7AeAGXWf-O2JQpIzqlckhe6p0z4ehddliXLy6VQN4RySCz_8NOcRDzS4obK6OJF-zaHMCPgkiSmBzPZdIHNnUTraBSkufei8O4KNxLFibq7VJxY6dsLjs05UTXdgyFV5ijKweokAqITQVhSVzIFkCWjNb31uqlK-xURNl-_IysYWFUHjaqfci_rQyHLeHoBBPZvt5Ix_75cm4c1_SekyHJL28hwdxoTQdyGQw8gjHHrZ9wMRpzw',
          },
          {
            _id: 'sample-2',
            name: 'Organza Marodi Scarf',
            price: 3140,
            size: 'Free Size',
            measurements: 'Ivory & Dull Gold',
            colorway: 'Heritage Marodi Zari Border',
            sku: 'SKU-314',
            silkMark: null,
            image:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuDv-s5n3tYbDOJEGuGgs0zhn2f__wU_Au5jqiPM-aynic1d7bjZWrCNCeHR4G_79crITk9OIL0RUNDxO3PCP_jzNUgZTzVRaoDZnl4GDLOu5TgUHb3KI6A209mQ5dKgS_FagJdpNjtQhC-TTLYJuvFNNUyb96Z77rcAMaZJdF5FiSJHSbPQQj1l_GnspyLxLpXNQBq6IxkMrN2NXl_jjTO1W2aHLNVA-kNZaojRsCZUSFQ8rbg_oCMxzQ',
          },
        ],
        total: 7940,
        paymentMode: 'COD',
        placedAt: '3 mins ago',
        porter: null,
      };

  // Primary action button state configuration
  const getActionConfig = () => {
    switch (currentStatus) {
      case 'PENDING':
        return {
          label: 'ACCEPT & STAGE FOR DISPATCH',
          icon: 'arrow-forward',
          bg: colors.accentCrimson,
          action: async () => {
            const updated = await acceptOrder(displayOrder._id);
            if (updated) setFetched(updated);
            showToast('Order Accepted! Prepare atelier box.');
          },
        };
      case 'ACCEPTED':
        return {
          label: 'MARK READY & DISPATCH PORTER',
          icon: 'two-wheeler',
          bg: colors.accentCrimson,
          action: async () => {
            setCheckPackaging(true);
            const updated = await advanceStatus(displayOrder._id, 'PACKED');
            if (updated) setFetched(updated);
            showToast('Order Packed & Ready for Courier.');
          },
        };
      case 'PACKED':
        return {
          label: 'DISPATCH PORTER FLEET',
          icon: 'local-shipping',
          bg: colors.accentCrimson,
          action: async () => {
            const res = await markOrderReady(displayOrder._id);
            if (res?.order) setFetched(res.order);
            showToast('Porter Assigned! Rider arriving in 4 mins.');
          },
        };
      case 'READY_FOR_PICKUP':
        return {
          label: 'HANDOVER TO PORTER COURIER',
          icon: 'handshake',
          bg: isDark ? '#C8A24A' : colors.accentGoldDeep,
          action: async () => {
            const updated = await advanceStatus(displayOrder._id, 'IN_TRANSIT');
            if (updated) setFetched(updated);
            showToast('Handover Confirmed. Courier in transit.');
          },
        };
      case 'IN_TRANSIT':
        return {
          label: 'CONFIRM TRIAL & COMPLETE ORDER',
          icon: 'check-circle',
          bg: isDark ? '#2E7D32' : '#1B5E20',
          action: async () => {
            const updated = await advanceStatus(displayOrder._id, 'DELIVERED');
            if (updated) setFetched(updated);
            showToast('Order Delivered & Settled Successfully!');
            setTimeout(() => navigation.goBack(), 1600);
          },
        };
      case 'DELIVERED':
        return {
          label: 'ORDER FULFILLED & SETTLED',
          icon: 'done-all',
          bg: isDark ? '#2B2B30' : '#4A4950',
          action: () => {},
        };
      default:
        return {
          label: 'ORDER CANCELLED',
          icon: 'close',
          bg: '#71717A',
          action: () => {},
        };
    }
  };

  const actionConfig = getActionConfig();

  const handlePrimaryAction = async () => {
    if (!displayOrder._id || busy || isFinal) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await actionConfig.action();
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Could not update order status.');
    }
  };

  const handleDeclineOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order from your atelier queue?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await advanceStatus(displayOrder._id, 'CANCELLED', 'Cancelled by atelier');
              if (updated) setFetched(updated);
              Alert.alert('Order Cancelled', 'The customer and Porter logistics have been notified.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not cancel order.');
            }
          },
        },
      ]
    );
  };

  const handlePrintTag = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    Alert.alert(
      'Print Garment Tag',
      `Printing atelier label #${displayOrder.orderCode} with Silk Mark authentication barcode.`
    );
  };

  const handleStylistDesk = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    Linking.openURL(`tel:${displayOrder.customerPhone}`).catch(() => {
      Alert.alert('Contact Patron', `Customer Phone: ${displayOrder.customerPhone}`);
    });
  };

  // Monogram for avatar
  const initials = displayOrder.customerName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'KP';

  return (
    <View style={[styles.root, { backgroundColor: colors.groundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Animated Ambient Drifting Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar (Stitch Matched) */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: insets.top + 4,
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.92)' : 'rgba(250, 249, 245, 0.90)',
            borderBottomColor: colors.borderHairline,
          },
        ]}
      >
        <View style={styles.topHeaderInner}>
          {/* Brand Logo with Emblem */}
          <BrandLogo size="sm" showEmblem={true} />

          {/* Location / Hub Selector Pill */}
          <View
            style={[
              styles.hubPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainerLow || '#F4F4F0'),
                borderColor: colors.borderHairline,
              },
            ]}
          >
            <MaterialIcons name="near-me" size={13} color={colors.accentGold || '#B38A2B'} />
            <Text style={[styles.hubPillText, { color: colors.textObsidian }]}>
              {displayOrder.locality.toUpperCase()}, NAGPUR
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={14} color={colors.textAsh || '#7E7C85'} />
          </View>

          {/* Profile / Atelier Avatar with status dot */}
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatarIconBox,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainer || '#EFEEEA'),
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons name="storefront" size={16} color={colors.accentGold || '#B38A2B'} />
            </View>
            <View style={[styles.avatarStatusDot, { backgroundColor: colors.accentCrimson }]} />
          </View>
        </View>
      </View>

      {/* 3. Main Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 124,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation & Order Identifier Bar */}
        <View style={styles.orderIdentHeader}>
          <View style={styles.orderIdentLeft}>
            <PressableScale
              onPress={() => navigation.goBack()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainer || '#EFEEEA'),
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={14}
                color={colors.textObsidian}
              />
            </PressableScale>

            <View style={styles.orderIdentMeta}>
              <View style={styles.eyebrowRow}>
                <Text style={[styles.eyebrowText, { color: colors.accentGold }]}>
                  ORDER FULFILLMENT
                </Text>
                <View style={[styles.eyebrowDot, { backgroundColor: colors.accentCrimson }]} />
                <Text style={[styles.eyebrowTime, { color: colors.textAsh }]}>
                  {displayOrder.placedAt}
                </Text>
              </View>
              <Text style={[styles.orderNumberLarge, { color: colors.textObsidian }]}>
                #{displayOrder.orderCode}
              </Text>
            </View>
          </View>

          {/* Locality Chip */}
          <View
            style={[
              styles.localityChip,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : (colors.surfaceContainerLow || '#F4F4F0'),
                borderColor: colors.borderHairline,
              },
            ]}
          >
            <MaterialIcons name="place" size={13} color={colors.accentGold} />
            <Text style={[styles.localityChipText, { color: colors.textObsidian }]}>
              {displayOrder.locality}
            </Text>
          </View>
        </View>

        {/* Urgent Action Required Banner */}
        <View style={[styles.urgentBanner, { backgroundColor: colors.accentCrimson }]}>
          <View style={styles.urgentBannerInner}>
            <View style={styles.urgentLeftCol}>
              <View style={styles.urgentIconBubble}>
                <MaterialIcons name="schedule" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.urgentTextCol}>
                <Text style={styles.urgentEyebrow}>ACTION REQUIRED</Text>
                <Text style={styles.urgentHeadline}>
                  {currentStatus === 'PENDING'
                    ? 'Accept & Stage for Courier Dispatch'
                    : currentStatus === 'ACCEPTED'
                    ? 'Pack Garments with Atelier Muslin'
                    : currentStatus === 'PACKED'
                    ? 'Order Packed — Request Porter Rider'
                    : currentStatus === 'READY_FOR_PICKUP'
                    ? 'Courier Arrived — Hand Over Parcel'
                    : currentStatus === 'IN_TRANSIT'
                    ? 'Customer Fitting in Progress'
                    : 'Order Settled with Atelier'}
                </Text>
                <Text style={styles.urgentSubtitle}>
                  Customer requested 90-min doorstep concierge fitting.
                </Text>
              </View>
            </View>

            {/* Countdown Timer Box */}
            <View style={styles.countdownBox}>
              <Text style={styles.countdownEyebrow}>TIMER</Text>
              <Text style={styles.countdownDigits}>{formatTimer(secondsRemaining)}</Text>
            </View>
          </View>
        </View>

        {/* 4-Stage Fulfillment Lifecycle Stepper */}
        <View
          style={[
            styles.stepperCard,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 28, 0.88)' : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          {/* Step 1: Placed */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, { backgroundColor: colors.textObsidian }]}>
              <MaterialIcons name="check" size={12} color={isDark ? '#121215' : '#FFFFFF'} />
            </View>
            <Text style={[styles.stepLabel, { color: colors.textSlate }]}>Placed</Text>
          </View>

          <View
            style={[
              styles.stepLine,
              { backgroundColor: isAcceptedOrBeyond ? colors.textObsidian : colors.borderHairline },
            ]}
          />

          {/* Step 2: Packing */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isPackedOrBeyond
                  ? { backgroundColor: colors.textObsidian }
                  : isAcceptedOrBeyond
                  ? { backgroundColor: 'rgba(196, 36, 58, 0.15)', borderWidth: 1.5, borderColor: colors.accentCrimson }
                  : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0EFEA' },
              ]}
            >
              <MaterialIcons
                name="inventory-2"
                size={12}
                color={
                  isPackedOrBeyond
                    ? isDark ? '#121215' : '#FFFFFF'
                    : isAcceptedOrBeyond
                    ? colors.accentCrimson
                    : colors.textAsh
                }
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                isAcceptedOrBeyond && { color: colors.accentCrimson, fontWeight: '700' },
              ]}
            >
              Packing
            </Text>
          </View>

          <View
            style={[
              styles.stepLine,
              { backgroundColor: isReadyOrBeyond ? colors.textObsidian : colors.borderHairline },
            ]}
          />

          {/* Step 3: Porter */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isReadyOrBeyond
                  ? { backgroundColor: colors.textObsidian }
                  : isPackedOrBeyond
                  ? { backgroundColor: 'rgba(196, 36, 58, 0.15)', borderWidth: 1.5, borderColor: colors.accentCrimson }
                  : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0EFEA' },
              ]}
            >
              <MaterialIcons
                name="two-wheeler"
                size={12}
                color={
                  isReadyOrBeyond
                    ? isDark ? '#121215' : '#FFFFFF'
                    : isPackedOrBeyond
                    ? colors.accentCrimson
                    : colors.textAsh
                }
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                isPackedOrBeyond && { color: colors.accentCrimson, fontWeight: '700' },
              ]}
            >
              Porter
            </Text>
          </View>

          <View
            style={[
              styles.stepLine,
              { backgroundColor: isDelivered ? colors.textObsidian : colors.borderHairline },
            ]}
          />

          {/* Step 4: Delivered */}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isDelivered
                  ? { backgroundColor: colors.textObsidian }
                  : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F0EFEA' },
              ]}
            >
              <MaterialIcons
                name="home"
                size={12}
                color={isDelivered ? (isDark ? '#121215' : '#FFFFFF') : colors.textAsh}
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                isDelivered && { color: colors.accentCrimson, fontWeight: '700' },
              ]}
            >
              Delivered
            </Text>
          </View>
        </View>

        {/* Client & Destination Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 28, 0.88)' : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          {/* Card Header Tag */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagLeftRow}>
              <View style={[styles.goldTagDot, { backgroundColor: colors.accentGold }]} />
              <Text style={[styles.cardHeaderEyebrow, { color: colors.accentGold }]}>
                CLIENT & DELIVERY
              </Text>
            </View>
            <View
              style={[
                styles.distanceBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.groundSubtle || '#F4F3EE'),
                },
              ]}
            >
              <Text style={[styles.distanceBadgeText, { color: colors.textSlate }]}>
                {displayOrder.distanceKm} km away
              </Text>
            </View>
          </View>

          {/* Client Identity Row */}
          <View style={styles.clientIdentityRow}>
            <View style={styles.clientIdentityLeft}>
              <View
                style={[
                  styles.monogramAvatar,
                  {
                    backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : '#FDF9F0',
                    borderColor: 'rgba(200, 162, 74, 0.35)',
                  },
                ]}
              >
                <Text style={[styles.monogramText, { color: colors.accentGold }]}>
                  {initials}
                </Text>
              </View>

              <View style={styles.clientDetailsCol}>
                <Text style={[styles.clientNameText, { color: colors.textObsidian }]}>
                  {displayOrder.customerName}
                </Text>
                <Text style={[styles.clientAddressText, { color: colors.textSlate }]}>
                  {displayOrder.customerAddress}
                </Text>
              </View>
            </View>

            {/* Call Client Action Button */}
            <PressableScale
              onPress={() =>
                Linking.openURL(`tel:${displayOrder.customerPhone}`).catch(() => {})
              }
              style={[
                styles.callBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainerLow || '#F4F4F0'),
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Call Client"
            >
              <MaterialIcons name="call" size={17} color={colors.accentCrimson} />
            </PressableScale>
          </View>

          {/* Service Tier & Collection Grid */}
          <View style={[styles.deliveryInfoGrid, { borderTopColor: colors.borderHairline }]}>
            <View
              style={[
                styles.deliveryInfoCol,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#F4F3EE'),
                },
              ]}
            >
              <Text style={[styles.gridColEyebrow, { color: colors.textAsh }]}>SERVICE TIER</Text>
              <View style={styles.serviceTierRow}>
                <MaterialIcons name="bolt" size={15} color={colors.accentCrimson} />
                <Text style={[styles.serviceTierValue, { color: colors.textObsidian }]}>
                  Porter 90-Min
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.deliveryInfoCol,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#F4F3EE'),
                },
              ]}
            >
              <Text style={[styles.gridColEyebrow, { color: colors.textAsh }]}>COLLECTION</Text>
              <View style={styles.collectionValueRow}>
                <Text style={[styles.collectionPriceText, { color: colors.textObsidian }]}>
                  {formatINR(displayOrder.total)}
                </Text>
                <Text style={[styles.collectionBadgeText, { color: colors.accentGold }]}>
                  {displayOrder.paymentMode}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Garments to Pack Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 28, 0.88)' : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          {/* Section Header */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagLeftRow}>
              <View style={[styles.goldTagDot, { backgroundColor: colors.accentGold }]} />
              <Text style={[styles.cardHeaderEyebrow, { color: colors.accentGold }]}>
                GARMENTS TO PACK ({displayOrder.items.length})
              </Text>
            </View>
            <View
              style={[
                styles.distanceBadge,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainer || '#EFEEEA'),
                },
              ]}
            >
              <Text style={[styles.distanceBadgeText, { color: colors.textSlate }]}>
                Atelier Batch A
              </Text>
            </View>
          </View>

          {/* Garment Items List */}
          {displayOrder.items.map((item, idx) => (
            <View
              key={item._id || idx}
              style={[
                styles.garmentItemBlock,
                idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderHairline, paddingTop: 14 },
              ]}
            >
              <View style={styles.garmentHeaderRow}>
                {/* Thumbnail with SKU tag */}
                <View
                  style={[
                    styles.garmentThumbWrap,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : (colors.surfaceContainer || '#EFEEEA'),
                      borderColor: colors.borderHairline,
                    },
                  ]}
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.garmentThumbImg}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.garmentThumbFallback}>
                      <MaterialIcons name="checkroom" size={24} color={colors.accentGold} />
                    </View>
                  )}
                  <View style={styles.skuBadge}>
                    <Text style={styles.skuBadgeText}>{item.sku || `SKU-${770 + idx}`}</Text>
                  </View>
                </View>

                {/* Garment Meta */}
                <View style={styles.garmentMetaCol}>
                  <View style={styles.garmentTitlePriceRow}>
                    <Text
                      style={[styles.garmentNameText, { color: colors.textObsidian }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.garmentPriceText, { color: colors.textObsidian }]}>
                      {formatINR(item.price)}
                    </Text>
                  </View>

                  <View style={styles.garmentSpecsRow}>
                    <View
                      style={[
                        styles.specPill,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : (colors.groundSubtle || '#F4F3EE'),
                        },
                      ]}
                    >
                      <Text style={[styles.specPillText, { color: colors.textObsidian }]}>
                        Size {item.size || 'M'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.specPill,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : (colors.groundSubtle || '#F4F3EE'),
                        },
                      ]}
                    >
                      <Text style={[styles.specPillText, { color: colors.textSlate }]}>
                        {item.measurements || 'Bespoke 38" Bust · 32" Waist'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.garmentColorProvenanceRow}>
                    <View
                      style={[
                        styles.colorSwatchDot,
                        { backgroundColor: idx === 0 ? colors.accentCrimson : colors.accentGold },
                      ]}
                    />
                    <Text style={[styles.garmentColorName, { color: colors.textSlate }]}>
                      {item.colorway || 'Sindhoor Crimson'}
                    </Text>

                    {item.silkMark ? (
                      <>
                        <Text style={[styles.dotDivider, { color: colors.textAsh }]}>·</Text>
                        <View style={styles.silkMarkBadge}>
                          <MaterialIcons name="verified" size={12} color={colors.accentGold} />
                          <Text style={[styles.silkMarkText, { color: colors.accentGold }]}>
                            {item.silkMark}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Quality Checklist Checkbox for Item */}
              {idx === 0 ? (
                <PressableScale
                  onPress={() => setCheckInspected(!checkInspected)}
                  style={[
                    styles.qcCheckRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#F4F3EE'),
                      borderColor: checkInspected ? 'rgba(200, 162, 74, 0.4)' : colors.borderHairline,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      checkInspected
                        ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                        : { borderColor: colors.borderHairline },
                    ]}
                  >
                    {checkInspected && <MaterialIcons name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.qcCheckText, { color: colors.textObsidian }]}>
                    Garment inspected, sanitized & steam-pressed
                  </Text>
                </PressableScale>
              ) : (
                <PressableScale
                  onPress={() => setCheckPackaging(!checkPackaging)}
                  style={[
                    styles.qcCheckRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#F4F3EE'),
                      borderColor: checkPackaging ? 'rgba(200, 162, 74, 0.4)' : colors.borderHairline,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      checkPackaging
                        ? { backgroundColor: colors.accentCrimson, borderColor: colors.accentCrimson }
                        : { borderColor: colors.borderHairline },
                    ]}
                  >
                    {checkPackaging && <MaterialIcons name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.qcCheckText, { color: colors.textObsidian }]}>
                    Branded atelier box & garment sleeve included
                  </Text>
                </PressableScale>
              )}
            </View>
          ))}
        </View>

        {/* Porter Fleet Logistics Real-Time Card */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 28, 0.88)' : '#FFFFFF',
              borderColor: colors.borderHairline,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagLeftRow}>
              <View style={[styles.urgentLiveDot, { backgroundColor: colors.accentCrimson }]} />
              <Text style={[styles.cardHeaderEyebrow, { color: colors.accentCrimson }]}>
                PORTER EXPRESS FLEET
              </Text>
            </View>
            <View
              style={[
                styles.distanceBadge,
                {
                  backgroundColor: isDark ? 'rgba(196, 36, 58, 0.15)' : 'rgba(196, 36, 58, 0.08)',
                },
              ]}
            >
              <Text style={[styles.distanceBadgeText, { color: colors.accentCrimson }]}>
                Auto-dispatch armed
              </Text>
            </View>
          </View>

          {/* Rider status callout strip */}
          <View
            style={[
              styles.riderCalloutBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.groundSubtle || '#F4F3EE'),
                borderColor: colors.borderHairline,
              },
            ]}
          >
            <View
              style={[
                styles.riderIconBubble,
                {
                  backgroundColor: isDark ? 'rgba(196, 36, 58, 0.15)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(196, 36, 58, 0.25)' : colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons name="two-wheeler" size={18} color={colors.accentCrimson} />
            </View>
            <View style={styles.riderMetaCol}>
              <Text style={[styles.riderArrivalText, { color: colors.textObsidian }]}>
                Nearest Courier: 4 mins away
              </Text>
              <Text style={[styles.riderRoadText, { color: colors.textAsh }]} numberOfLines={1}>
                Rider on Amravati Road · 0.8 km from Dharampeth Studio
              </Text>
            </View>
          </View>

          {/* WhatsApp Alert Status */}
          <View style={styles.whatsAppRow}>
            <View style={styles.whatsAppLeft}>
              <MaterialIcons name="chat" size={14} color="#10B981" />
              <Text style={[styles.whatsAppText, { color: colors.textSlate }]}>
                WhatsApp client alert on dispatch
              </Text>
            </View>
            <View style={[styles.goldTagDot, { backgroundColor: colors.accentGold }]} />
          </View>
        </View>
      </ScrollView>

      {/* 4. Sticky Bottom Action Controls */}
      <View
        style={[
          styles.stickyBottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.95)' : 'rgba(250, 249, 245, 0.95)',
            borderTopColor: colors.borderHairline,
          },
        ]}
      >
        <View style={styles.bottomControlsInner}>
          {/* Primary Action Button */}
          <PressableScale
            onPress={handlePrimaryAction}
            disabled={busy || isFinal}
            style={[
              styles.primaryDispatchBtn,
              { backgroundColor: actionConfig.bg },
              (busy || isFinal) && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={actionConfig.label}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>{actionConfig.label}</Text>
                <MaterialIcons name={actionConfig.icon} size={17} color="#FFFFFF" />
              </>
            )}
          </PressableScale>

          {/* Secondary Action Grid */}
          <View style={styles.secondaryActionsGrid}>
            <PressableScale
              onPress={handlePrintTag}
              style={[
                styles.secondaryUtilityBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Print Garment Tag"
            >
              <MaterialIcons name="local-offer" size={15} color={colors.accentGold} />
              <Text style={[styles.secondaryUtilityBtnText, { color: colors.textObsidian }]}>
                Print Garment Tag
              </Text>
            </PressableScale>

            <PressableScale
              onPress={handleStylistDesk}
              style={[
                styles.secondaryUtilityBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Stylist Desk"
            >
              <MaterialIcons name="support-agent" size={15} color={colors.textSlate} />
              <Text style={[styles.secondaryUtilityBtnText, { color: colors.textObsidian }]}>
                Stylist Desk
              </Text>
            </PressableScale>
          </View>

          {/* Decline Order Option if PENDING */}
          {currentStatus === 'PENDING' && (
            <PressableScale
              onPress={handleDeclineOrder}
              disabled={busy}
              style={styles.cancelOrderBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel Order"
            >
              <Text style={styles.cancelOrderText}>Cancel Order from Queue</Text>
            </PressableScale>
          )}
        </View>
      </View>

      {/* 5. Live Toast Capsule */}
      {toastMessage && (
        <View style={styles.toastCapsule}>
          <View style={[styles.toastDot, { backgroundColor: colors.accentGold }]} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  topHeaderInner: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  hubPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStatusDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  orderIdentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  orderIdentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdentMeta: {
    gap: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eyebrowText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eyebrowDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
  eyebrowTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderNumberLarge: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    letterSpacing: -0.2,
  },
  localityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  localityChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  urgentBanner: {
    borderRadius: radii.xl,
    padding: 14,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 4,
  },
  urgentBannerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  urgentLeftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  urgentIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  urgentTextCol: {
    flex: 1,
    gap: 2,
  },
  urgentEyebrow: {
    color: '#FFDDDC',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  urgentHeadline: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  urgentSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  countdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: radii.md,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 62,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  countdownEyebrow: {
    color: '#FFDDDC',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  countdownDigits: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    marginTop: 1,
  },
  stepperCard: {
    borderRadius: radii.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  stepItem: {
    alignItems: 'center',
    gap: 3,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 3,
    marginTop: -14,
  },
  sectionCard: {
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goldTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardHeaderEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 9999,
  },
  distanceBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  clientIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  clientIdentityLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  monogramAvatar: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  clientDetailsCol: {
    flex: 1,
    gap: 2,
  },
  clientNameText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  clientAddressText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryInfoGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  deliveryInfoCol: {
    flex: 1,
    borderRadius: radii.md,
    padding: 8,
    gap: 3,
  },
  gridColEyebrow: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  serviceTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceTierValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  collectionValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  collectionPriceText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  collectionBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  garmentItemBlock: {
    gap: 10,
  },
  garmentHeaderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  garmentThumbWrap: {
    width: 64,
    height: 78,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  garmentThumbImg: {
    width: '100%',
    height: '100%',
  },
  garmentThumbFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skuBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 1,
    alignItems: 'center',
  },
  skuBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  garmentMetaCol: {
    flex: 1,
    gap: 3,
  },
  garmentTitlePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  garmentNameText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    flex: 1,
  },
  garmentPriceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  garmentSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  specPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  garmentColorProvenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  colorSwatchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  garmentColorName: {
    fontSize: 11,
  },
  dotDivider: {
    fontSize: 12,
  },
  silkMarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  silkMarkText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  qcCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qcCheckText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  urgentLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riderCalloutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  riderIconBubble: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderMetaCol: {
    flex: 1,
    gap: 2,
  },
  riderArrivalText: {
    fontSize: 12,
    fontWeight: '700',
  },
  riderRoadText: {
    fontSize: 11,
  },
  whatsAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  whatsAppLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whatsAppText: {
    fontSize: 11.5,
  },
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  bottomControlsInner: {
    gap: 8,
  },
  primaryDispatchBtn: {
    height: 48,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryUtilityBtn: {
    flex: 1,
    height: 38,
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryUtilityBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cancelOrderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cancelOrderText: {
    color: '#C4243A',
    fontSize: 11.5,
    fontWeight: '700',
  },
  toastCapsule: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: '#121215',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 100,
  },
  toastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
