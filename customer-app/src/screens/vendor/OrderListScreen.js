import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
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
import VendorBottomNav from '../../components/vendor/VendorBottomNav';
import { formatCurrency as formatINR, shortOrderId } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useVendorStore,
  selectStatusCounts,
  selectVisibleOrders,
} from '../../store/useVendorStore';

/**
 * VendorOrderListScreen — Customer Orders Queue
 * Tailored for Nagpur Boutique Shopkeepers:
 * - High contrast & large touch targets
 * - Hero "+ ADD NEW GARMENT" button right at the top
 * - Instant status filter tabs (All, New, Accepted, Packed, Ready, In Transit, Delivered)
 * - Clear order cards with large prices & simple process buttons
 * - Integrated VendorBottomNav
 */
export default function VendorOrderListScreen({ navigation }) {
  const insets = useSafeAreaInsets();

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

      {/* 2. Top Header Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.topBarInner}>
          <View style={styles.shopIdentity}>
            <Text style={styles.shopName} numberOfLines={1}>
              {vendorProfile?.shopName || 'Nagpur Boutique'}
            </Text>
            <Text style={styles.shopSubtitle}>Nagpur Dispatch Desk</Text>
          </View>

          <View style={styles.topBarActions}>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>

            <PressableScale
              onPress={() => navigation.navigate('VendorProfile')}
              style={styles.profileIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Store Profile"
            >
              <MaterialIcons name="storefront" size={20} color={colors.textObsidian} />
            </PressableScale>
          </View>
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
            paddingBottom: insets.bottom + 95,
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
            {/* Quick Action: ADD NEW GARMENT */}
            <PressableScale
              onPress={() => navigation.navigate('CatalogManager', { openAddModal: true })}
              style={styles.addPieceHeroCard}
              accessibilityRole="button"
              accessibilityLabel="Add New Garment"
            >
              <View style={styles.addPieceHeroIconWrap}>
                <MaterialIcons name="add-a-photo" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.addPieceHeroTextCol}>
                <Text style={styles.addPieceHeroTitle}>ADD NEW GARMENT</Text>
                <Text style={styles.addPieceHeroSubtitle}>
                  Add a new piece or garment to your boutique catalog
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
            </PressableScale>

            {/* Performance Stats Ticker */}
            <View style={styles.tickerCard}>
              <PressableScale
                onPress={() => handleFilterChange('DELIVERED')}
                style={styles.tickerItem}
                accessibilityRole="button"
                accessibilityLabel="Filter delivered orders"
              >
                <MaterialIcons name="check-circle" size={18} color="#15803D" />
                <Text style={styles.tickerValue}>{counts.DELIVERED || 0} Delivered</Text>
              </PressableScale>
              <View style={styles.tickerDivider} />
              <PressableScale
                onPress={() => handleFilterChange('PENDING')}
                style={styles.tickerItem}
                accessibilityRole="button"
                accessibilityLabel="Filter new orders"
              >
                <MaterialIcons name="schedule" size={18} color={colors.accentCrimson} />
                <Text style={styles.tickerValue}>{counts.PENDING || 0} New Orders</Text>
              </PressableScale>
              <View style={styles.tickerDivider} />
              <PressableScale
                onPress={() => handleFilterChange('READY_FOR_PICKUP')}
                style={styles.tickerItem}
                accessibilityRole="button"
                accessibilityLabel="Filter ready orders"
              >
                <MaterialIcons name="two-wheeler" size={18} color={colors.accentGoldDeep} />
                <Text style={styles.tickerValue}>{counts.READY_FOR_PICKUP || 0} Ready</Text>
              </PressableScale>
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
                      isActive ? styles.filterTabActive : styles.filterTabInactive,
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
              <Text style={styles.queueTitle}>Customer Orders List</Text>
              <Text style={styles.queueCount}>
                {displayOrders.length} Orders
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
            <View style={styles.emptyCard}>
              <MaterialIcons name="inventory" size={50} color={colors.accentGold} />
              <Text style={styles.emptyTitle}>
                No Orders Yet
              </Text>
              <Text style={styles.emptySubtitle}>
                {statusFilter === 'ALL'
                  ? 'Customer orders from Nagpur will appear here in real time.'
                  : `No orders currently in "${statusFilter}" status.`}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isUrgent = item.isUrgent || item.status === 'accepted';
          const itemName =
            item.items?.[0]?.name || item.item?.name || 'Handloom Garment';
          const itemPrice = item.totalPrice || item.total || item.item?.price || 2400;
          const locality =
            item.deliveryAddress?.area ||
            item.customer?.locality ||
            'Sitabuldi, Nagpur';
          const distance = item.customer?.distanceKm || 2.4;
          const status = (item.status || 'PENDING').toUpperCase();

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
                    Order {shortOrderId(item.orderId || item._id)}
                  </Text>
                  {isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                </View>

                <View style={styles.porterEtaBadge}>
                  <MaterialIcons name="two-wheeler" size={15} color={colors.accentGoldDeep} />
                  <Text style={styles.porterEtaText}>
                    {item.porterEta || 'Porter Rider Ready'}
                  </Text>
                </View>
              </View>

              {/* Garment Details */}
              <Text style={styles.garmentTitle}>{itemName}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaPrice}>{formatINR(itemPrice)}</Text>
                <Text style={styles.metaLocality}>
                  📍 {locality} · {distance} km
                </Text>
              </View>

              {/* Action Button */}
              <View style={styles.cardBottomRow}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>{status}</Text>
                </View>

                <View style={styles.viewOrderBtn}>
                  <Text style={styles.viewOrderText}>View & Process Order</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.accentCrimson} />
                </View>
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
    backgroundColor: '#F4EFE7',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: 8,
    backgroundColor: 'rgba(244, 239, 231, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.12)',
  },
  topBarInner: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  shopIdentity: {
    justifyContent: 'center',
    flex: 1,
    paddingRight: 8,
  },
  shopName: {
    color: colors.textObsidian,
    fontSize: 14.5,
    fontWeight: '800',
  },
  shopSubtitle: {
    color: colors.accentGoldDeep,
    fontSize: 10.5,
    fontWeight: '700',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196, 36, 58, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  liveIndicatorText: {
    color: colors.accentCrimson,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  profileIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  queueHeader: {
    gap: 12,
    marginBottom: spacing.xs,
  },
  addPieceHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentCrimson,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
    shadowColor: colors.accentCrimson,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  addPieceHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addPieceHeroTextCol: {
    flex: 1,
  },
  addPieceHeroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addPieceHeroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  tickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.22)',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tickerValue: {
    color: colors.textObsidian,
    fontSize: 12.5,
    fontWeight: '800',
  },
  tickerDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterTabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  filterTabActive: {
    backgroundColor: colors.textObsidian,
  },
  filterTabInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  filterTabText: {
    color: colors.textSlate,
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '900',
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
    fontWeight: '800',
  },
  queueCount: {
    color: colors.textSlate,
    fontSize: 13,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    gap: 10,
    shadowColor: '#121215',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    fontSize: 15,
    fontWeight: '800',
  },
  urgentBadge: {
    backgroundColor: 'rgba(196, 36, 58, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  urgentText: {
    color: colors.accentCrimson,
    fontSize: 10,
    fontWeight: '900',
  },
  porterEtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  porterEtaText: {
    color: colors.accentGoldDeep,
    fontSize: 11,
    fontWeight: '800',
  },
  garmentTitle: {
    color: colors.textObsidian,
    fontSize: 17,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaPrice: {
    color: colors.accentCrimson,
    fontSize: 17,
    fontWeight: '900',
  },
  metaLocality: {
    color: colors.textSlate,
    fontSize: 13,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingTop: 10,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F3F5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCrimson,
  },
  statusLabel: {
    color: colors.textObsidian,
    fontSize: 11,
    fontWeight: '800',
  },
  viewOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(196, 36, 58, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  viewOrderText: {
    color: colors.accentCrimson,
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textObsidian,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSlate,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
