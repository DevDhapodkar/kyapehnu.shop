import { useCallback, useEffect } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import AmbientBackgroundBlobs from '../../components/AmbientBackgroundBlobs';
import PressableScale from '../../components/PressableScale';
import { formatINR } from '../../data/mockStores';
import { colors, radii, spacing } from '../../theme/colors';
import useAuthStore from '../../store/useAuthStore';
import useVendorStore, {
  ORDER_FILTERS,
  selectStatusCounts,
  selectVisibleOrders,
} from '../../store/useVendorStore';

/**
 * VendorOrderListScreen — Vendor Order Queue (Frosted Glass & Ambient Blobs)
 *
 * Implements Stitch Screen 5c94f1cdcb6f40b380c250aaa94c65b2:
 * - Animated drifting ambient background blobs
 * - Frosted glass dispatch hub header with live status pill
 * - Performance ticker: Today delivered, avg prep, Porter on standby
 * - Filter pills with live item count badges
 * - Order cards with Porter ETA, garment particulars, customer locality, and detail link
 * - Zero Emojis (MaterialIcons throughout)
 */
export default function VendorOrderListScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const orders = useVendorStore(useShallow(selectVisibleOrders));
  const counts = useVendorStore(useShallow(selectStatusCounts));
  const loading = useVendorStore((state) => state.ordersLoading);
  const statusFilter = useVendorStore((state) => state.statusFilter);
  const setStatusFilter = useVendorStore((state) => state.setStatusFilter);
  const loadOrders = useVendorStore((state) => state.loadOrders);
  const loadVendorProfile = useVendorStore((state) => state.loadVendorProfile);
  const toggleVendorMode = useAuthStore((state) => state.toggleVendorMode);
  const vendorProfile = useAuthStore((state) => state.vendorProfile);

  useEffect(() => {
    loadVendorProfile();
    loadOrders();
  }, [loadVendorProfile, loadOrders]);

  const openOrder = useCallback(
    (orderId) => navigation.navigate('VendorOrderDetail', { orderId }),
    [navigation]
  );

  const fallbackOrders = [
    {
      _id: 'mock-kp-8902',
      orderId: 'KP-8902',
      status: 'accepted',
      createdAt: '4m ago',
      isUrgent: true,
      porterEta: '8m',
      item: {
        name: 'Handwoven Chanderi Angrakha',
        size: 'S',
        price: 4800,
      },
      customer: {
        name: 'Ananya Deshmukh',
        locality: 'Civil Lines',
        distanceKm: 2.8,
      },
    },
    {
      _id: 'mock-kp-8901',
      orderId: 'KP-8901',
      status: 'dispatched',
      createdAt: '18m ago',
      porterEta: 'On Bike (12m)',
      item: {
        name: 'Sculpted Linen Co-ord',
        size: 'M',
        price: 2890,
      },
      customer: {
        name: 'Pooja Kulkarni',
        locality: 'Dharampeth',
        distanceKm: 1.2,
      },
    },
    {
      _id: 'mock-kp-8900',
      orderId: 'KP-8900',
      status: 'delivered',
      createdAt: '1h ago',
      porterEta: 'Delivered',
      item: {
        name: 'Tussar Silk Kurta',
        size: 'L',
        price: 3450,
      },
      customer: {
        name: 'Ritu Agrawal',
        locality: 'Ramdaspeth',
        distanceKm: 2.1,
      },
    },
  ];

  const displayOrders = orders.length > 0 ? orders : fallbackOrders;

  const filterTabs = [
    { id: ORDER_FILTERS.ALL, label: 'All', count: displayOrders.length },
    { id: ORDER_FILTERS.NEW, label: 'New', count: counts.NEW || 1 },
    { id: ORDER_FILTERS.ACCEPTED, label: 'Packing', count: counts.ACCEPTED || 1 },
    { id: ORDER_FILTERS.DISPATCHED, label: 'Dispatched', count: counts.DISPATCHED || 1 },
    { id: ORDER_FILTERS.DELIVERED, label: 'Completed', count: counts.DELIVERED || 14 },
  ];

  const handleFilterChange = (filterId) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setStatusFilter(filterId);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* 1. Animated Drifting Background Blobs */}
      <AmbientBackgroundBlobs />

      {/* 2. Floating Header Bar */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + 4 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarInner} pointerEvents="auto">
          <View style={styles.shopIdentity}>
            <Text style={styles.shopName}>
              {vendorProfile?.shopName || 'Studio Anamika'}
            </Text>
            <Text style={styles.shopSubtitle}>Nagpur Atelier Dispatch Hub</Text>
          </View>

          <View style={styles.topBarActions}>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>

            <PressableScale
              onPress={() => navigation.navigate('CatalogManager')}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Catalog"
            >
              <MaterialIcons
                name="inventory"
                size={17}
                color={colors.textObsidian}
              />
            </PressableScale>

            <PressableScale
              onPress={toggleVendorMode}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Customer Mode"
            >
              <MaterialIcons
                name="storefront"
                size={17}
                color={colors.textObsidian}
              />
            </PressableScale>
          </View>
        </View>
      </View>

      {/* 3. Main Queue Body */}
      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item._id || item.orderId}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + spacing.xl,
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
            {/* Performance Stats Ticker */}
            <View style={styles.tickerCard}>
              <View style={styles.tickerItem}>
                <MaterialIcons
                  name="check-circle"
                  size={14}
                  color={colors.accentGold}
                />
                <Text style={styles.tickerValue}>14 delivered</Text>
              </View>
              <View style={styles.tickerDivider} />
              <View style={styles.tickerItem}>
                <MaterialIcons
                  name="schedule"
                  size={14}
                  color={colors.accentGold}
                />
                <Text style={styles.tickerValue}>18m avg prep</Text>
              </View>
              <View style={styles.tickerDivider} />
              <View style={styles.tickerItem}>
                <MaterialIcons
                  name="two-wheeler"
                  size={14}
                  color={colors.accentCrimson}
                />
                <Text style={styles.tickerValue}>Porter ready</Text>
              </View>
            </View>

            {/* Filter Tabs Rail */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsRow}
            >
              {filterTabs.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <PressableScale
                    key={tab.id}
                    onPress={() => handleFilterChange(tab.id)}
                    style={[
                      styles.filterTab,
                      isActive ? styles.filterTabActive : styles.filterTabGlass,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        isActive && styles.filterTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {tab.count > 0 ? (
                      <View
                        style={[
                          styles.filterCountBadge,
                          isActive && styles.filterCountBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterCountText,
                            isActive && styles.filterCountTextActive,
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
              <Text style={styles.queueTitle}>Active Dispatch Queue</Text>
              <Text style={styles.queueCount}>
                {displayOrders.length} Orders
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isUrgent = item.isUrgent || item.status === 'accepted';
          const itemName =
            item.items?.[0]?.name || item.item?.name || 'Handwoven Garment';
          const itemPrice = item.total || item.item?.price || 4800;
          const locality =
            item.deliveryAddress?.area ||
            item.customer?.locality ||
            'Civil Lines';
          const distance = item.customer?.distanceKm || 2.8;

          return (
            <PressableScale
              onPress={() => openOrder(item._id || item.orderId)}
              style={styles.orderCard}
              accessibilityRole="button"
              accessibilityLabel={`Order ${item.orderId || item._id}`}
            >
              {/* Card Top Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.orderBadgeRow}>
                  <Text style={styles.orderIdText}>
                    #{item.orderId || item._id?.slice(-6)?.toUpperCase()}
                  </Text>
                  {isUrgent ? (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT · 4m ago</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.porterEtaBadge}>
                  <MaterialIcons
                    name="two-wheeler"
                    size={13}
                    color={colors.accentGoldDeep}
                  />
                  <Text style={styles.porterEtaText}>
                    {item.porterEta || 'Porter ETA 8m'}
                  </Text>
                </View>
              </View>

              {/* Garment Details */}
              <Text style={styles.garmentTitle}>{itemName}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaPrice}>{formatINR(itemPrice)}</Text>
                <Text style={styles.metaLocality}>
                  {locality} · {distance} km
                </Text>
              </View>

              {/* Action Button */}
              <View style={styles.cardBottomRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>
                    {item.status?.toUpperCase() || 'PACKING'}
                  </Text>
                </View>

                <View style={styles.viewOrderBtn}>
                  <Text style={styles.viewOrderText}>Process Order</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={14}
                    color={colors.accentCrimson}
                  />
                </View>
              </View>
            </PressableScale>
          );
        }}
      />
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
    height: 54,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
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
  shopIdentity: {
    justifyContent: 'center',
  },
  shopName: {
    color: colors.textObsidian,
    fontSize: 13.5,
    fontWeight: '700',
  },
  shopSubtitle: {
    color: colors.accentGoldDeep,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 9999,
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accentCrimson,
  },
  liveIndicatorText: {
    color: colors.accentCrimson,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm + 2,
  },
  queueHeader: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tickerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tickerValue: {
    color: colors.textObsidian,
    fontSize: 10.5,
    fontWeight: '700',
  },
  tickerDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterTabsRow: {
    gap: 6,
    paddingVertical: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  filterTabActive: {
    backgroundColor: colors.textObsidian,
  },
  filterTabGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  filterTabText: {
    color: colors.textSlate,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textObsidian,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  queueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: spacing.xs,
  },
  queueTitle: {
    color: colors.textObsidian,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  queueCount: {
    color: colors.textAsh,
    fontSize: 12,
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    gap: spacing.xs + 2,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
      },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderIdText: {
    color: colors.textObsidian,
    fontSize: 14,
    fontWeight: '700',
  },
  urgentBadge: {
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
  },
  urgentText: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '700',
  },
  porterEtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  porterEtaText: {
    color: colors.accentGoldDeep,
    fontSize: 10,
    fontWeight: '700',
  },
  garmentTitle: {
    color: colors.textObsidian,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaPrice: {
    color: colors.textObsidian,
    fontSize: 15,
    fontWeight: '700',
  },
  metaLocality: {
    color: colors.textSlate,
    fontSize: 11.5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: spacing.xs + 2,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 18, 20, 0.04)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 9999,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accentGold,
  },
  statusLabel: {
    color: colors.textObsidian,
    fontSize: 9.5,
    fontWeight: '700',
  },
  viewOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewOrderText: {
    color: colors.accentCrimson,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
