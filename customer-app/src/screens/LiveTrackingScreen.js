import { useEffect, useState } from 'react';
import {
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

import AmbientBackgroundBlobs from '../components/AmbientBackgroundBlobs';
import PressableScale from '../components/PressableScale';
import { formatINR } from '../data/mockStores';
import { colors, radii, spacing } from '../theme/colors';

/**
 * LiveTrackingScreen — Rider in Motion (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen 5375e4130ff5444f8524b25b4cd203ee:
 * - Animated drifting ambient background blobs
 * - Subtle optical glass pinned header with location selector
 * - Animated route radar card: Studio Anamika -> Rider in Motion -> Civil Lines
 * - Live ETA pill (18m ETA · En Route) with recenter button
 * - Step progression: Confirmed -> Picked Up -> On the Way
 * - Rider profile card: Rameshwar T., Honda Activa, Call & WhatsApp actions
 * - Order summary chip with garment details
 * - Help & Return to Storefront CTAs
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function LiveTrackingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { order } = route.params || {};

  const [etaMinutes, setEtaMinutes] = useState(order?.etaMinutes || 18);

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((prev) => (prev > 2 ? prev - 1 : prev));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const orderId = order?.orderId || 'KP-8902';
  const orderItem = order?.items?.[0] || {
    name: 'Handwoven Chanderi Angrakha',
    price: 4800,
    storeName: 'Studio Anamika',
  };
  const total = order?.total || 4800;
  const rider = order?.rider || {
    name: 'Rameshwar T.',
    rating: '4.9',
    vehicle: 'Honda Activa · MH 31 EQ 8492',
    phone: '+91 98221 55940',
  };

  const handleCallRider = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    Linking.openURL(`tel:${rider.phone}`).catch(() => {
      Alert.alert('Call Concierge', `Calling ${rider.name} at ${rider.phone}...`);
    });
  };

  const handleWhatsAppRider = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    const cleanPhone = rider.phone.replace(/[^0-9]/g, '');
    Linking.openURL(
      `https://wa.me/${cleanPhone}?text=Hi%20${rider.name},%20regarding%20my%20Kya%20Pehnu%20order%20${orderId}`
    ).catch(() => {
      Alert.alert('WhatsApp Concierge', 'Opening WhatsApp concierge chat...');
    });
  };

  const handleNeedHelp = () => {
    Alert.alert(
      'Nagpur Concierge Care',
      'Doorstep fitting coordinator available at +91 712 254 9900.\nMaster tailor on standby for fittings.',
      [
        { text: 'Call Hotline', onPress: () => Linking.openURL('tel:+917122549900').catch(() => {}) },
        { text: 'Close', style: 'cancel' },
      ]
    );
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
            onPress={() => navigation.navigate('Home')}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Go to Storefront"
          >
            <MaterialIcons
              name="arrow-back-ios-new"
              size={17}
              color={colors.textObsidian}
            />
          </PressableScale>

          <View style={styles.locationPill}>
            <MaterialIcons name="near-me" size={13} color={colors.accentGold} />
            <Text style={styles.locationText}>Sitabuldi, Nagpur</Text>
            <MaterialIcons
              name="expand-more"
              size={15}
              color={colors.textAsh}
            />
          </View>

          <PressableScale
            onPress={handleNeedHelp}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Help"
          >
            <MaterialIcons
              name="support-agent"
              size={18}
              color={colors.textObsidian}
            />
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Tracking Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Route & Radar Map Card */}
        <View style={styles.radarCard}>
          {/* Radar background circles */}
          <View style={styles.radarBackground}>
            <View style={styles.radarCircle1} />
            <View style={styles.radarCircle2} />
          </View>

          {/* Route nodes */}
          <View style={styles.routeRow}>
            {/* Atelier Node */}
            <View style={styles.routeNode}>
              <View style={styles.atelierPin}>
                <MaterialIcons
                  name="local-mall"
                  size={14}
                  color={colors.accentGoldDeep}
                />
              </View>
              <Text style={styles.nodeTitle}>Studio Anamika</Text>
              <Text style={styles.nodeSub}>Dharampeth</Text>
            </View>

            {/* Connecting line with moving rider */}
            <View style={styles.routeTrack}>
              <View style={styles.trackLine} />
              <View style={styles.riderMarker}>
                <MaterialIcons name="two-wheeler" size={16} color="#FFFFFF" />
              </View>
            </View>

            {/* Destination Node */}
            <View style={styles.routeNode}>
              <View style={styles.homePin}>
                <MaterialIcons
                  name="home"
                  size={15}
                  color={colors.accentCrimson}
                />
              </View>
              <Text style={styles.nodeTitle}>Palm Grove 402</Text>
              <Text style={styles.nodeSub}>Civil Lines</Text>
            </View>
          </View>

          {/* Floating ETA Banner */}
          <View style={styles.etaBar}>
            <View style={styles.etaPill}>
              <MaterialIcons name="bolt" size={14} color={colors.accentGold} />
              <Text style={styles.etaText}>{etaMinutes}m ETA · En Route</Text>
            </View>
            <View style={styles.distancePill}>
              <Text style={styles.distanceText}>2.4 km remaining</Text>
            </View>
          </View>
        </View>

        {/* Live Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.statusEyebrow}>
                NAGPUR EXPRESS · {orderId}
              </Text>
              <Text style={styles.statusTitle}>Rider in Motion</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>

          {/* 3-Step Progress Indicator */}
          <View style={styles.progressRow}>
            {/* Step 1: Confirmed */}
            <View style={styles.progressStep}>
              <View style={styles.stepCircleDone}>
                <MaterialIcons name="check" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabelDone}>Confirmed</Text>
            </View>

            <View style={styles.progressLineDone} />

            {/* Step 2: Picked Up */}
            <View style={styles.progressStep}>
              <View style={styles.stepCircleDone}>
                <MaterialIcons name="check" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabelDone}>Picked Up</Text>
            </View>

            <View style={styles.progressLineDone} />

            {/* Step 3: On the Way */}
            <View style={styles.progressStep}>
              <View style={styles.stepCircleActive}>
                <View style={styles.activeCoreDot} />
              </View>
              <Text style={styles.stepLabelActive}>On the Way</Text>
            </View>
          </View>
        </View>

        {/* Rider Profile Card */}
        <View style={styles.riderCard}>
          <View style={styles.riderAvatar}>
            <Text style={styles.riderAvatarText}>R</Text>
          </View>

          <View style={styles.riderInfoCol}>
            <View style={styles.riderNameRow}>
              <Text style={styles.riderName}>{rider.name}</Text>
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={12} color={colors.accentGold} />
                <Text style={styles.ratingText}>{rider.rating}</Text>
              </View>
            </View>
            <Text style={styles.riderVehicle}>{rider.vehicle}</Text>
          </View>

          {/* Contact Action Buttons */}
          <View style={styles.riderActions}>
            <PressableScale
              onPress={handleCallRider}
              style={styles.contactBtn}
              accessibilityRole="button"
              accessibilityLabel="Call rider"
            >
              <MaterialIcons name="call" size={16} color={colors.textObsidian} />
              <Text style={styles.contactBtnLabel}>Call</Text>
            </PressableScale>

            <PressableScale
              onPress={handleWhatsAppRider}
              style={styles.contactBtn}
              accessibilityRole="button"
              accessibilityLabel="WhatsApp rider"
            >
              <MaterialIcons name="chat" size={16} color={colors.textObsidian} />
              <Text style={styles.contactBtnLabel}>WhatsApp</Text>
            </PressableScale>
          </View>
        </View>

        {/* Garment Summary Chip */}
        <View style={styles.garmentCard}>
          <View style={styles.garmentIconWrap}>
            <MaterialIcons
              name="checkroom"
              size={18}
              color={colors.accentGold}
            />
          </View>
          <View style={styles.garmentInfoCol}>
            <Text style={styles.garmentName} numberOfLines={1}>
              {orderItem.name}
            </Text>
            <Text style={styles.garmentStore}>
              {orderItem.storeName || 'Studio Anamika'} · Dharampeth
            </Text>
          </View>
          <Text style={styles.garmentPrice}>{formatINR(total)}</Text>
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
          <PressableScale
            onPress={handleNeedHelp}
            style={styles.helpBtn}
            accessibilityRole="button"
            accessibilityLabel="Need Help"
          >
            <MaterialIcons
              name="support-agent"
              size={16}
              color={colors.textObsidian}
            />
            <Text style={styles.helpText}>Need Help?</Text>
          </PressableScale>

          <PressableScale
            onPress={() => navigation.navigate('Home')}
            style={styles.storefrontBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to Storefront"
          >
            <Text style={styles.storefrontLabel}>Storefront</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
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
  radarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      },
    }),
  },
  radarBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircle1: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.12)',
  },
  radarCircle2: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.08)',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  routeNode: {
    alignItems: 'center',
    width: 90,
  },
  atelierPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  homePin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nodeTitle: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  nodeSub: {
    color: colors.textAsh,
    fontSize: 9.5,
    marginTop: 1,
  },
  routeTrack: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(18, 18, 20, 0.12)',
    borderRadius: 1,
  },
  riderMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  etaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  etaText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '700',
  },
  distancePill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  distanceText: {
    color: colors.textSlate,
    fontSize: 11,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusEyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusTitle: {
    color: colors.textObsidian,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  liveBadgeText: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircleDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textObsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelDone: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '600',
  },
  progressLineDone: {
    flex: 1,
    height: 2,
    backgroundColor: colors.textObsidian,
    marginHorizontal: 4,
    marginTop: -16,
  },
  stepCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(244, 63, 94, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.accentCrimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentCrimson,
  },
  stepLabelActive: {
    color: colors.accentCrimson,
    fontSize: 10.5,
    fontWeight: '700',
  },
  riderCard: {
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
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.textObsidian,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  riderInfoCol: {
    flex: 1,
  },
  riderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riderName: {
    color: colors.textObsidian,
    fontSize: 14.5,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '600',
  },
  riderVehicle: {
    color: colors.textSlate,
    fontSize: 11,
    marginTop: 2,
  },
  riderActions: {
    flexDirection: 'row',
    gap: 6,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  contactBtnLabel: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '600',
  },
  garmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  garmentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  garmentInfoCol: {
    flex: 1,
  },
  garmentName: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '600',
  },
  garmentStore: {
    color: colors.textAsh,
    fontSize: 10.5,
  },
  garmentPrice: {
    color: colors.textObsidian,
    fontSize: 14,
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
    height: 60,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 4,
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
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  helpText: {
    color: colors.textObsidian,
    fontSize: 12,
    fontWeight: '600',
  },
  storefrontBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: 9999,
    paddingVertical: 9,
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
  storefrontLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
