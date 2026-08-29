import { useCallback, useEffect, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import FilterTabs from '../../components/vendor/FilterTabs';
import OrderCard from '../../components/vendor/OrderCard';
import {
  BrandMark,
  EmptyState,
  Icon,
  IconButton,
  LiveDot,
  Skeleton,
  StatRow,
  StatTile,
  Surface,
} from '../../components/ui';
import { formatCurrency } from '../../utils/format';
import { colors, spacing } from '../../theme/colors';
import { duration, easing, type } from '../../theme/tokens';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ORDER_FILTERS,
  selectStatusCounts,
  selectVisibleOrders,
  useVendorStore,
} from '../../store/useVendorStore';

/** Orders the shopkeeper still owes an action on. */
const NEEDS_ACTION = ['PENDING', 'ACCEPTED', 'PACKED'];

/**
 * The vendor flow's home: every incoming order, filtered by where it sits in
 * the lifecycle. Pull-to-refresh rather than polling — a shop counter runs on a
 * phone that should not be burning battery on a timer. Push (FCM) is the
 * intended wake-up for new orders; this screen only owns the manual path.
 *
 * The desk opens with three numbers rather than a list, because the first
 * question at a counter is never "what is order #4F2A" — it is "how many are
 * waiting on me, and what have I taken today".
 */
export default function VendorOrderListScreen({ navigation }) {
  // Both selectors build a fresh array/object on every call, so they need
  // `useShallow` — a referential comparison would re-render on every store
  // write and trip React's "getSnapshot should be cached" loop guard.
  const orders = useVendorStore(useShallow(selectVisibleOrders));
  const counts = useVendorStore(useShallow(selectStatusCounts));
  const allOrders = useVendorStore(useShallow((state) => state.orders));
  const loading = useVendorStore((state) => state.ordersLoading);
  const error = useVendorStore((state) => state.ordersError);
  const statusFilter = useVendorStore((state) => state.statusFilter);
  const setStatusFilter = useVendorStore((state) => state.setStatusFilter);
  const loadOrders = useVendorStore((state) => state.loadOrders);
  const loadVendorProfile = useVendorStore((state) => state.loadVendorProfile);

  const vendorProfile = useAuthStore((state) => state.vendorProfile);

  useEffect(() => {
    loadVendorProfile();
    loadOrders();
  }, [loadVendorProfile, loadOrders]);

  const summary = useMemo(() => {
    const list = allOrders ?? [];
    const waiting = list.filter((order) => NEEDS_ACTION.includes(order.status)).length;
    const moving = list.filter((order) =>
      ['READY_FOR_PICKUP', 'IN_TRANSIT'].includes(order.status),
    ).length;
    const takings = list
      .filter((order) => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + (order.totalPrice ?? 0), 0);
    return { waiting, moving, takings };
  }, [allOrders]);

  const openOrder = useCallback(
    (orderId) => navigation.navigate('VendorOrderDetail', { orderId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => (
      <OrderCard order={item} index={index} onPress={() => openOrder(item._id)} />
    ),
    [openOrder]
  );

  // The first load owns the whole screen; every load after it is a quiet
  // refresh control so the list never blanks out under the vendor.
  const coldLoading = loading && orders.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Animated.View
        entering={FadeInDown.duration(duration.slow).easing(easing.out)}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <View style={styles.eyebrowRow}>
            <BrandMark size={20} />
            <Text style={styles.eyebrow}>VENDOR DESK</Text>
            {summary.waiting > 0 ? <LiveDot size={5} color={colors.gold} /> : null}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {vendorProfile?.shopName ?? 'Your Shop'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <IconButton
            icon="grid"
            onPress={() => navigation.navigate('CatalogManager')}
            accessibilityLabel="Manage your catalogue"
            size={40}
          />
          <IconButton
            icon="user"
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profile and settings"
            size={40}
          />
        </View>
      </Animated.View>

      <Surface tone="sunken" padding="compact" lift="flat" style={styles.summaryCard}>
        <StatRow>
          <StatTile
            icon="bell"
            value={String(summary.waiting)}
            label="need you"
            emphasis={summary.waiting > 0 ? 'gold' : 'muted'}
          />
          <StatTile
            icon="truck"
            value={String(summary.moving)}
            label="in transit"
            emphasis={summary.moving > 0 ? 'crimson' : 'muted'}
          />
          <StatTile
            icon="trending-up"
            value={formatCurrency(summary.takings)}
            label="order value"
          />
        </StatRow>
      </Surface>

      <FilterTabs
        options={ORDER_FILTERS}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
      />

      {error ? (
        <Surface tone="accent" padding="compact" lift="low" style={styles.banner}>
          <View style={styles.bannerRow}>
            <Icon name="wifi-off" size="sm" color={colors.crimsonGlow} />
            <View style={styles.bannerBody}>
              <Text style={styles.bannerTitle}>Couldn’t reach the store</Text>
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          </View>
        </Surface>
      ) : null}

      {coldLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((index) => (
            <Surface key={index} padding="compact" lift="low" style={styles.skeletonCard}>
              <Skeleton width="45%" height={16} />
              <Skeleton width="80%" height={12} style={styles.skeletonGap} />
              <Skeleton width="65%" height={12} style={styles.skeletonGap} />
            </Surface>
          ))}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={styles.listFlex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              tintColor={colors.platinum}
              colors={[colors.crimsonBright]}
              progressBackgroundColor={colors.charcoal}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="inbox"
              title="Nothing here yet"
              body={`No orders sitting in ${
                ORDER_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase() ??
                'this queue'
              }. Pull down to refresh — new orders also arrive as a push.`}
              actionLabel="Refresh"
              onAction={loadOrders}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  title: {
    ...type.title,
    fontSize: 25,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  summaryCard: {
    marginHorizontal: spacing.m,
  },
  banner: {
    marginHorizontal: spacing.m,
    marginTop: spacing.xs,
  },
  bannerRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  bannerBody: {
    flex: 1,
  },
  bannerTitle: {
    ...type.subheading,
    fontSize: 14,
  },
  bannerText: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
    lineHeight: 17,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  skeletonList: {
    padding: spacing.m,
    gap: spacing.sm,
  },
  skeletonCard: {
    marginBottom: 0,
  },
  skeletonGap: {
    marginTop: spacing.s,
  },
});
