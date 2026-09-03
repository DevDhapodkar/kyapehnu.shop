import { useState } from 'react';
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
 * MyOrdersScreen — Orders & Fitting Archive (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen 96713c4a6fac48ebb5c6f2f2c6eb6de9:
 * - Animated drifting ambient background blobs
 * - Top header with brand concierge wordmark & location
 * - Tab switcher: Active Orders vs Past Archive (2)
 * - Rich active order card with live route corridor info & direct "Track Live" button
 * - Past order archive cards with reorder, receipt, and rating actions
 * - Doorstep Tailor Fitting concierge consultation banner
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function MyOrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('active'); // 'active' | 'archive'

  const activeOrder = {
    orderId: 'KP-8902',
    atelierName: 'Studio Anamika',
    locality: 'Dharampeth',
    itemName: 'Handwoven Chanderi Angrakha',
    size: 'S',
    colorway: 'Ivory Silk',
    price: 4800,
    etaMinutes: 18,
    corridor: 'Near Law College, West High Court Rd',
    status: 'In Transit',
  };

  const pastOrders = [
    {
      orderId: 'KP-6410',
      atelierName: 'Boutique 9',
      locality: 'Sadar',
      date: 'Yesterday',
      itemName: 'Sculpted Linen Co-ord',
      size: 'M',
      price: 2890,
      outcome: 'Kept',
    },
    {
      orderId: 'KP-5198',
      atelierName: 'Maheshwari Handlooms',
      locality: 'Gandhibagh',
      date: '4 days ago',
      itemName: 'Tussar Silk Kurta',
      size: 'L',
      price: 3450,
      outcome: 'Kept',
    },
  ];

  const handleTrackLive = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.navigate('LiveTracking', {
      order: {
        orderId: activeOrder.orderId,
        etaMinutes: activeOrder.etaMinutes,
        total: activeOrder.price,
        items: [
          {
            name: activeOrder.itemName,
            price: activeOrder.price,
            storeName: activeOrder.atelierName,
          },
        ],
      },
    });
  };

  const handleTailorChat = () => {
    Linking.openURL(
      'https://wa.me/917122549900?text=Hi%20Kya%20Pehnu%20Concierge,%20I%20would%20like%20to%20request%20a%20doorstep%20tailor%20alteration%20visit.'
    ).catch(() => {
      Alert.alert(
        'Tailor Fitting',
        'Doorstep alteration master on-call at +91 712 254 9900.'
      );
    });
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

          <View style={styles.locationPill}>
            <MaterialIcons name="near-me" size={13} color={colors.accentGold} />
            <Text style={styles.locationText}>Sitabuldi, Nagpur</Text>
            <MaterialIcons
              name="expand-more"
              size={15}
              color={colors.textAsh}
            />
          </View>

          <View style={{ width: 34 }} />
        </View>
      </View>

      {/* 3. Main Scrollable Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.titleSection}>
          <Text style={styles.eyebrow}>Nagpur Concierge</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Orders</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>3 items</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsRow}>
          <PressableScale
            onPress={() => setSelectedTab('active')}
            style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'active' && styles.tabTextActive,
              ]}
            >
              Active Orders
            </Text>
          </PressableScale>

          <PressableScale
            onPress={() => setSelectedTab('archive')}
            style={[styles.tab, selectedTab === 'archive' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'archive' && styles.tabTextActive,
              ]}
            >
              Past Archive (2)
            </Text>
          </PressableScale>
        </View>

        {selectedTab === 'active' ? (
          /* Active Order Card */
          <View style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View>
                <View style={styles.atelierTagRow}>
                  <Text style={styles.atelierName}>
                    {activeOrder.atelierName}
                  </Text>
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color={colors.accentGold}
                  />
                </View>
                <Text style={styles.orderIdSub}>
                  {activeOrder.locality} · Order #{activeOrder.orderId}
                </Text>
              </View>

              <View style={styles.inTransitBadge}>
                <View style={styles.transitDot} />
                <Text style={styles.inTransitText}>In Transit</Text>
              </View>
            </View>

            <Text style={styles.garmentTitle}>{activeOrder.itemName}</Text>

            <View style={styles.garmentMetaRow}>
              <Text style={styles.garmentSize}>
                Size {activeOrder.size} · {activeOrder.colorway}
              </Text>
              <Text style={styles.garmentPrice}>
                {formatINR(activeOrder.price)}
              </Text>
            </View>

            {/* Rider Corridor Tracking Banner */}
            <View style={styles.corridorBanner}>
              <MaterialIcons
                name="two-wheeler"
                size={18}
                color={colors.accentCrimson}
              />
              <View style={styles.corridorTextCol}>
                <Text style={styles.corridorTitle}>
                  Rider en route · {activeOrder.etaMinutes}m ETA
                </Text>
                <Text style={styles.corridorSub}>{activeOrder.corridor}</Text>
              </View>
            </View>

            {/* Quick Status Tags */}
            <View style={styles.tagsRow}>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>Dispatched</Text>
              </View>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>On Bike</Text>
              </View>
              <View style={styles.statusTag}>
                <Text style={styles.statusTagText}>Try & Buy</Text>
              </View>
            </View>

            {/* Track Live CTA */}
            <PressableScale
              onPress={handleTrackLive}
              style={styles.trackLiveBtn}
              accessibilityRole="button"
              accessibilityLabel="Track Live"
            >
              <MaterialIcons
                name="navigation"
                size={17}
                color="#FFFFFF"
              />
              <Text style={styles.trackLiveLabel}>Track Live</Text>
            </PressableScale>
          </View>
        ) : null}

        {/* Past Archive List */}
        <View style={styles.archiveSection}>
          <Text style={styles.archiveSectionTitle}>Past Archive</Text>

          <View style={styles.archiveList}>
            {pastOrders.map((ord) => (
              <View key={ord.orderId} style={styles.archiveCard}>
                <View style={styles.archiveHeaderRow}>
                  <View>
                    <Text style={styles.archiveAtelier}>
                      {ord.atelierName} · {ord.locality}
                    </Text>
                    <Text style={styles.archiveDate}>
                      #{ord.orderId} · {ord.date}
                    </Text>
                  </View>

                  <View style={styles.keptBadge}>
                    <MaterialIcons
                      name="check-circle"
                      size={13}
                      color={colors.accentGoldDeep}
                    />
                    <Text style={styles.keptText}>{ord.outcome}</Text>
                  </View>
                </View>

                <View style={styles.archiveGarmentRow}>
                  <Text style={styles.archiveGarmentName}>{ord.itemName}</Text>
                  <Text style={styles.archivePrice}>
                    {formatINR(ord.price)}
                  </Text>
                </View>

                <View style={styles.archiveActionsRow}>
                  <PressableScale
                    onPress={() =>
                      Alert.alert(
                        'Reorder',
                        `Requesting ${ord.itemName} from ${ord.atelierName}...`
                      )
                    }
                    style={styles.reorderBtn}
                  >
                    <MaterialIcons
                      name="receipt-long"
                      size={14}
                      color={colors.textObsidian}
                    />
                    <Text style={styles.reorderBtnText}>
                      Receipt & Reorder
                    </Text>
                  </PressableScale>

                  <PressableScale
                    onPress={() =>
                      Alert.alert(
                        'Rate Atelier',
                        `Leave a review for ${ord.atelierName}.`
                      )
                    }
                    style={styles.rateBtn}
                  >
                    <MaterialIcons
                      name="star"
                      size={14}
                      color={colors.accentGold}
                    />
                    <Text style={styles.rateBtnText}>Rate Atelier</Text>
                  </PressableScale>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Doorstep Tailor Fitting Banner */}
        <View style={styles.tailorBanner}>
          <View style={styles.tailorIconWrap}>
            <MaterialIcons
              name="design-services"
              size={22}
              color={colors.accentGold}
            />
          </View>

          <View style={styles.tailorInfoCol}>
            <Text style={styles.tailorTitle}>Doorstep Tailor Fitting</Text>
            <Text style={styles.tailorSub}>
              Alteration master on-call in Nagpur for adjustments
            </Text>
          </View>

          <PressableScale
            onPress={handleTailorChat}
            style={styles.tailorChatBtn}
            accessibilityRole="button"
            accessibilityLabel="Chat with tailor"
          >
            <Text style={styles.tailorChatText}>Chat</Text>
          </PressableScale>
        </View>
      </ScrollView>
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
    gap: spacing.md,
  },
  titleSection: {
    paddingHorizontal: 4,
    marginTop: spacing.xs,
  },
  eyebrow: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    color: colors.textObsidian,
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  countText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 9999,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: colors.textObsidian,
  },
  tabText: {
    color: colors.textSlate,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    gap: spacing.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
      },
    }),
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  atelierTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  atelierName: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  orderIdSub: {
    color: colors.textAsh,
    fontSize: 11,
    marginTop: 2,
  },
  inTransitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  transitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  inTransitText: {
    color: colors.accentCrimson,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  garmentTitle: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  garmentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  garmentSize: {
    color: colors.textSlate,
    fontSize: 12,
  },
  garmentPrice: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '700',
  },
  corridorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  corridorTextCol: {
    flex: 1,
  },
  corridorTitle: {
    color: colors.textObsidian,
    fontSize: 12,
    fontWeight: '700',
  },
  corridorSub: {
    color: colors.textAsh,
    fontSize: 10.5,
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusTag: {
    backgroundColor: 'rgba(18, 18, 20, 0.04)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  statusTagText: {
    color: colors.textObsidian,
    fontSize: 10,
    fontWeight: '600',
  },
  trackLiveBtn: {
    backgroundColor: colors.accentCrimson,
    borderRadius: radii.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  trackLiveLabel: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  archiveSection: {
    gap: spacing.sm,
  },
  archiveSectionTitle: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    paddingHorizontal: 4,
  },
  archiveList: {
    gap: spacing.sm,
  },
  archiveCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    gap: spacing.xs + 2,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      },
    }),
  },
  archiveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  archiveAtelier: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '700',
  },
  archiveDate: {
    color: colors.textAsh,
    fontSize: 10.5,
    marginTop: 1,
  },
  keptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
  },
  keptText: {
    color: colors.accentGoldDeep,
    fontSize: 10,
    fontWeight: '700',
  },
  archiveGarmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  archiveGarmentName: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '500',
  },
  archivePrice: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  archiveActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  reorderBtnText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '600',
  },
  rateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  rateBtnText: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '600',
  },
  tailorBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: spacing.xs,
  },
  tailorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tailorInfoCol: {
    flex: 1,
  },
  tailorTitle: {
    color: colors.textObsidian,
    fontSize: 13,
    fontWeight: '700',
  },
  tailorSub: {
    color: colors.textSlate,
    fontSize: 10.5,
    marginTop: 1,
  },
  tailorChatBtn: {
    backgroundColor: colors.textObsidian,
    borderRadius: 9999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  tailorChatText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
