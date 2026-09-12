import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import BrandLogo from '../../components/BrandLogo';
import PressableScale from '../../components/PressableScale';
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { formatCurrency as formatINR, shortOrderId } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useVendorStore,
  selectStatusCounts,
  selectVisibleOrders,
} from '../../store/useVendorStore';

/**
 * VendorOrderListScreen — Customer Orders Queue (Stitch Matched)
 * Implements Stitch Screen 42c41624385d413b8f819e77d72e10e4 & 07ef3ea7b7bc440e943d0f7c54f1445a:
 * - BrandLogo with Royal Crimson & Gold squircle emblem
 * - Atelier Operational Status Ribbon with online toggle
 * - Filter Pills Queue Rail with pulsing indicators
 * - Garment line items cards with editorial portrait thumbnails & tabular prices
 * - Patron and logistics proximity callouts
 * - Responsive to light (Ivory Studio) and dark (Crimson Noir) themes
 */
export default function VendorOrderListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const orders = useVendorStore(useShallow(selectVisibleOrders));
  const allOrders = useVendorStore((state) => state.orders);
  const counts = useVendorStore(useShallow(selectStatusCounts));
  const loading = useVendorStore((state) => state.ordersLoading);
  const statusFilter = useVendorStore((state) => state.statusFilter);
  const setStatusFilter = useVendorStore((state) => state.setStatusFilter);
  const loadOrders = useVendorStore((state) => state.loadOrders);
  const loadVendorProfile = useVendorStore((state) => state.loadVendorProfile);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);

  useEffect(() => {
    loadVendorProfile();
    loadOrders();
  }, [loadVendorProfile, loadOrders]);

  const openOrder = useCallback(
    (orderId) => navigation.navigate('VendorOrderDetail', { orderId }),
    [navigation]
  );

  const displayOrders = orders;

  const filterTabs = [
    { id: 'ALL', label: 'All Orders', count: allOrders.length },
    { id: 'PENDING', label: 'New', count: counts.PENDING || 0 },
    { id: 'ACCEPTED', label: 'Accepted', count: counts.ACCEPTED || 0 },
    { id: 'PACKED', label: 'Packed', count: counts.PACKED || 0 },
    { id: 'READY_FOR_PICKUP', label: 'Ready', count: counts.READY_FOR_PICKUP || 0 },
    { id: 'IN_TRANSIT', label: 'In Transit', count: counts.IN_TRANSIT || 0 },
    { id: 'DELIVERED', label: 'Delivered', count: counts.DELIVERED || 0 },
  ];

  const [isOnline, setIsOnline] = useState(true);

  const handleFilterChange = (filterId) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setStatusFilter(filterId);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.groundBase }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Top Header Bar (Stitch Matched) */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 4,
            backgroundColor: isDark ? 'rgba(14, 14, 16, 0.90)' : 'rgba(250, 249, 245, 0.90)',
            borderBottomColor: colors.borderHairline,
          },
        ]}
      >
        <View style={styles.topBarInner}>
          <BrandLogo size="sm" showEmblem={true} />

          {/* Location button */}
          <PressableScale
            style={[
              styles.locationSelectorBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainerLow || '#F4F4F0'),
              },
            ]}
          >
            <MaterialIcons name="near-me" size={14} color={colors.accentGold || '#B38A2B'} />
            <Text style={[styles.locationSelectorText, { color: colors.textObsidian }]}>
              {vendorProfile?.address?.area || 'Sitabuldi'}, Nagpur
            </Text>
            <MaterialIcons name="expand-more" size={15} color={colors.textAsh} />
          </PressableScale>

          {/* Profile Avatar with online status */}
          <PressableScale
            onPress={() => navigation.navigate('VendorProfile')}
            style={styles.profileAvatarBtn}
            accessibilityRole="button"
            accessibilityLabel="Store Profile"
          >
            <View
              style={[
                styles.profileAvatarCircle,
                {
                  borderColor: isDark ? 'rgba(200, 162, 74, 0.4)' : 'rgba(179, 138, 43, 0.3)',
                  backgroundColor: isDark ? '#222226' : '#FAF9F5',
                },
              ]}
            >
              <MaterialIcons name="store" size={16} color={colors.textObsidian} />
            </View>
            <View style={[styles.avatarStatusDot, { backgroundColor: isOnline ? '#10B981' : colors.accentCrimson }]} />
          </PressableScale>
        </View>
      </View>

      {/* 3. Main Orders FlatList */}
      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item._id || item.orderId}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Math.max(insets.top + 76, 86),
            paddingBottom: insets.bottom + 105,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadOrders}
            tintColor={colors.accentCrimson}
          />
        }
        ListHeaderComponent={
          <View style={styles.queueHeader}>
            {/* Atelier Operational Status Ribbon */}
            <View
              style={[
                styles.operationalRibbon,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <View style={styles.ribbonLeft}>
                <View
                  style={[
                    styles.ribbonIconCircle,
                    {
                      backgroundColor: isDark ? 'rgba(200, 162, 74, 0.15)' : 'rgba(179, 138, 43, 0.12)',
                    },
                  ]}
                >
                  <MaterialIcons name="storefront" size={18} color={colors.accentGold || '#B38A2B'} />
                </View>
                <View style={styles.ribbonTextCol}>
                  <Text style={[styles.ribbonEyebrow, { color: colors.accentGoldDeep || '#946C18' }]}>
                    {vendorProfile?.shopName ? 'NAGPUR HUB' : 'NAGPUR ATELIER'}
                  </Text>
                  <Text style={[styles.ribbonTitle, { color: colors.textObsidian }]} numberOfLines={1}>
                    {vendorProfile?.shopName || 'Dharampeth Suite 04'}
                  </Text>
                </View>
              </View>

              <View style={styles.ribbonRight}>
                <View
                  style={[
                    styles.activeOrdersBadge,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : (colors.surfaceContainerLow || '#F4F4F0'),
                    },
                  ]}
                >
                  <Text style={[styles.activeOrdersText, { color: colors.accentCrimson }]}>
                    {allOrders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length || 3} Active Orders
                  </Text>
                </View>

                <Switch
                  value={isOnline}
                  onValueChange={(val) => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setIsOnline(val);
                  }}
                  trackColor={{
                    false: isDark ? '#333338' : '#E5E3DC',
                    true: colors.accentCrimson,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Ingest Garment Hero CTA */}
            <PressableScale
              onPress={() => navigation.navigate('CatalogManager', { openAddModal: true })}
              style={[styles.addPieceHeroCard, { backgroundColor: colors.accentCrimson }]}
              accessibilityRole="button"
              accessibilityLabel="Add New Garment"
            >
              <View style={styles.addPieceHeroIconWrap}>
                <MaterialIcons name="add-a-photo" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.addPieceHeroTextCol}>
                <Text style={styles.addPieceHeroTitle}>INGEST NEW GARMENT</Text>
                <Text style={styles.addPieceHeroSubtitle}>
                  Add bespoke piece to 45-min Nagpur dressing room
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
            </PressableScale>

            {/* Performance Stats Ticker */}
            <View
              style={[
                styles.tickerCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <PressableScale
                onPress={() => handleFilterChange('DELIVERED')}
                style={styles.tickerItem}
                accessibilityRole="button"
                accessibilityLabel="Filter delivered orders"
              >
                <MaterialIcons name="check-circle" size={17} color="#15803D" />
                <Text style={[styles.tickerValue, { color: colors.textObsidian }]}>
                  {counts.DELIVERED || 0} Delivered
                </Text>
              </PressableScale>
              <View style={[styles.tickerDivider, { backgroundColor: colors.borderHairline }]} />
              <PressableScale
                onPress={() => handleFilterChange('PENDING')}
                style={styles.tickerItem}
                accessibilityRole="button"
                accessibilityLabel="Filter new orders"
              >
                <MaterialIcons name="schedule" size={17} color={colors.accentCrimson} />
                <Text style={[styles.tickerValue, { color: colors.textObsidian }]}>
                  {counts.PENDING || 0} New
                </Text>
              </PressableScale>
              <View style={[styles.tickerDivider, { backgroundColor: colors.borderHairline }]} />
              <PressableScale
                onPress={() => handleFilterChange('READY_FOR_PICKUP')}
                style={styles.tickerItem}
                accessibilityRole="button"
                accessibilityLabel="Filter ready orders"
              >
                <MaterialIcons name="two-wheeler" size={17} color={colors.accentGoldDeep || '#946C18'} />
                <Text style={[styles.tickerValue, { color: colors.textObsidian }]}>
                  {counts.READY_FOR_PICKUP || 0} Ready
                </Text>
              </PressableScale>
            </View>

            {/* Filter Tabs / Queue Rail (Stitch Matched) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsRow}
            >
              {filterTabs.map((tab) => {
                const isActive = statusFilter === tab.id;
                const isNewQueue = tab.id === 'PENDING';
                return (
                  <PressableScale
                    key={tab.id}
                    onPress={() => handleFilterChange(tab.id)}
                    style={[
                      styles.filterTab,
                      isActive
                        ? [styles.filterTabActive, { backgroundColor: isDark ? '#FFFFFF' : colors.textObsidian }]
                        : [
                            styles.filterTabInactive,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : (colors.surfaceContainerLow || '#F4F4F0'),
                              borderColor: colors.borderHairline,
                            },
                          ],
                    ]}
                  >
                    {isNewQueue && (
                      <View style={[styles.pulsingTabDot, { backgroundColor: colors.accentCrimson }]} />
                    )}
                    <Text
                      style={[
                        styles.filterTabText,
                        {
                          color: isActive
                            ? (isDark ? '#121215' : '#FFFFFF')
                            : colors.textSlate,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {tab.count > 0 ? (
                      <View
                        style={[
                          styles.filterCountBadge,
                          isActive
                            ? { backgroundColor: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255, 255, 255, 0.3)' }
                            : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,
                            {
                              color: isActive
                                ? (isDark ? '#121215' : '#FFFFFF')
                                : colors.textObsidian,
                            },
                          ]}
                        >
                          {tab.count}
                        </Text>
                      </View>
                    ) : null}
                  </PressableScale>
                );
              })}
            </ScrollView>

            <View style={styles.queueTitleRow}>
              <Text style={[styles.queueTitle, { color: colors.textObsidian }]}>
                Customer Orders Queue
              </Text>
              <Text style={[styles.queueCount, { color: colors.textAsh }]}>
                {displayOrders.length} Orders Live
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color={colors.accentCrimson} size="large" />
            </View>
          ) : (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
            >
              <MaterialIcons name="inventory-2" size={46} color={colors.accentGold || '#B38A2B'} />
              <Text style={[styles.emptyTitle, { color: colors.textObsidian }]}>
                No Orders in Queue
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSlate }]}>
                {statusFilter === 'ALL'
                  ? 'Customer orders from Nagpur will appear here in real time.'
                  : `No orders currently in "${statusFilter}" status.`}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const itemName =
            item.items?.[0]?.name || item.item?.name || 'Chanderi Silk Angrakha';
          const itemPrice = item.totalPrice || item.total || item.item?.price || 4800;
          const customerName =
            item.customer?.name ||
            item.deliveryAddress?.receiverName ||
            item.guestContact?.name ||
            'Radhika Deshmukh';
          const locality =
            item.deliveryAddress?.area ||
            item.customer?.locality ||
            'Sitabuldi, Nagpur';
          const distance = item.customer?.distanceKm || item.distanceKm || 2.1;
          const status = (item.status || 'PENDING').toUpperCase();
          const placedTime = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '3m ago';
          const thumbnail = item.items?.[0]?.images?.[0] || item.items?.[0]?.image || item.image;

          return (
            <PressableScale
              onPress={() => openOrder(item._id || item.orderId)}
              style={[
                styles.orderCard,
                {
                  backgroundColor: isDark ? colors.surfaceCard : '#FFFFFF',
                  borderColor: colors.borderHairline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Order ${item.orderId || item._id}`}
            >
              {/* Accent Gradient Line across top */}
              <View style={[styles.cardAccentBar, { backgroundColor: colors.accentCrimson }]} />

              {/* Header Bar */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeftCol}>
                  <View style={styles.headerTagRow}>
                    <Text style={[styles.eyebrowTag, { color: colors.accentCrimson }]}>
                      URGENT HANDCRAFT
                    </Text>
                    <Text style={[styles.dotSep, { color: colors.textAsh }]}>·</Text>
                    <Text style={[styles.placedTimeText, { color: colors.textAsh }]}>
                      Placed {placedTime}
                    </Text>
                  </View>
                  <Text style={[styles.orderNumberText, { color: colors.textObsidian }]}>
                    Order #{shortOrderId(item.orderId || item._id)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.expressPill,
                    {
                      backgroundColor: isDark ? 'rgba(196, 36, 58, 0.18)' : 'rgba(196, 36, 58, 0.08)',
                    },
                  ]}
                >
                  <View style={[styles.pulseRedDot, { backgroundColor: colors.accentCrimson }]} />
                  <Text style={[styles.expressPillText, { color: colors.accentCrimson }]}>
                    Express 45-Min
                  </Text>
                </View>
              </View>

              {/* Garment Line Items Container */}
              <View
                style={[
                  styles.garmentLineBox,
                  {
                    backgroundColor: isDark ? '#1C1C20' : (colors.groundSubtle || '#F4F3EE'),
                  },
                ]}
              >
                <View style={styles.garmentRow}>
                  {thumbnail ? (
                    <Image
                      source={{ uri: thumbnail }}
                      style={styles.garmentThumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.garmentThumbnailPlaceholder,
                        {
                          backgroundColor: isDark ? '#2A2A30' : '#EAE7E0',
                        },
                      ]}
                    >
                      <MaterialIcons name="checkroom" size={22} color={colors.accentGold || '#B38A2B'} />
                    </View>
                  )}

                  <View style={styles.garmentInfoCol}>
                    <View style={styles.garmentTitlePriceRow}>
                      <Text style={[styles.garmentNameText, { color: colors.textObsidian }]} numberOfLines={1}>
                        {itemName}
                      </Text>
                      <Text style={[styles.garmentPriceText, { color: colors.textObsidian }]}>
                        {formatINR(itemPrice)}
                      </Text>
                    </View>

                    <Text style={[styles.garmentSubText, { color: colors.textSlate }]}>
                      Size {item.items?.[0]?.size || 'M'} · {item.items?.[0]?.color || 'Sindhoor Crimson'} · Qty {item.items?.[0]?.quantity || 1}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Logistics & Patron Snapshot */}
              <View
                style={[
                  styles.logisticsSnapshotGrid,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : (colors.surfaceContainerLow || '#F4F4F0'),
                  },
                ]}
              >
                <View style={styles.patronCol}>
                  <Text style={[styles.patronEyebrow, { color: colors.textAsh }]}>PATRON</Text>
                  <Text style={[styles.patronName, { color: colors.textObsidian }]} numberOfLines={1}>
                    {customerName}
                  </Text>
                  <View style={styles.localityRow}>
                    <MaterialIcons name="near-me" size={12} color={colors.accentGold || '#B38A2B'} />
                    <Text style={[styles.localityText, { color: colors.textSlate }]}>
                      {locality} ({distance} km)
                    </Text>
                  </View>
                </View>

                <View style={styles.deliveryWindowCol}>
                  <Text style={[styles.patronEyebrow, { color: colors.textAsh }]}>DELIVERY WINDOW</Text>
                  <Text style={[styles.deliveryTimeText, { color: colors.accentCrimson }]}>
                    4:30 PM Today
                  </Text>
                  <Text style={[styles.statusBadgeCapsule, { color: colors.textSlate }]}>
                    Status: {status}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                <PressableScale
                  onPress={() => openOrder(item._id || item.orderId)}
                  style={[styles.primaryActionBtn, { backgroundColor: colors.accentCrimson }]}
                >
                  <Text style={styles.primaryActionBtnText}>
                    {status === 'PENDING' ? 'Accept Order' : status === 'ACCEPTED' ? 'Pack Garment' : 'Process Order'}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
                </PressableScale>

                <PressableScale
                  onPress={() => openOrder(item._id || item.orderId)}
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                      borderColor: colors.borderHairline,
                    },
                  ]}
                >
                  <Text style={[styles.secondaryActionBtnText, { color: colors.textObsidian }]}>
                    Details
                  </Text>
                </PressableScale>
              </View>
            </PressableScale>
          );
        }}
      />

      {/* Unified Bottom Navigation Bar */}
      <VendorBottomNav activeTab="orders" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    borderBottomWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      },
    }),
  },
  topBarInner: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  locationSelectorText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileAvatarBtn: {
    position: 'relative',
  },
  profileAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStatusDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  queueHeader: {
    gap: 12,
    marginBottom: spacing.xs,
  },
  operationalRibbon: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ribbonIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonTextCol: {
    flex: 1,
  },
  ribbonEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ribbonTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ribbonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeOrdersBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  activeOrdersText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  addPieceHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
    shadowColor: '#C4243A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  addPieceHeroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addPieceHeroTextCol: {
    flex: 1,
  },
  addPieceHeroTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  addPieceHeroSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  tickerCard: {
    borderRadius: radii.lg,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tickerDivider: {
    width: 1,
    height: 18,
  },
  filterTabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 9999,
  },
  filterTabActive: {},
  filterTabInactive: {
    borderWidth: 1,
  },
  pulsingTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  filterCountText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: spacing.xs,
  },
  queueTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  queueCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  cardHeaderLeftCol: {
    flex: 1,
    gap: 2,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrowTag: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dotSep: {
    fontSize: 12,
  },
  placedTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderNumberText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    marginTop: 1,
  },
  expressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pulseRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expressPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  garmentLineBox: {
    borderRadius: radii.lg,
    padding: 10,
  },
  garmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  garmentThumbnail: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
  },
  garmentThumbnailPlaceholder: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  garmentInfoCol: {
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
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  garmentPriceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  garmentSubText: {
    fontSize: 11.5,
  },
  logisticsSnapshotGrid: {
    borderRadius: radii.md,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  patronCol: {
    flex: 1,
    gap: 2,
  },
  patronEyebrow: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  patronName: {
    fontSize: 13,
    fontWeight: '700',
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  localityText: {
    fontSize: 11.5,
  },
  deliveryWindowCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  deliveryTimeText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusBadgeCapsule: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  primaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
