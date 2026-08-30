import { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import OrderCard from '../../components/vendor/OrderCard';
import { Avatar, EmptyState, IconButton, SegmentedTabs, Surface } from '../../components/ui';
import { formatCurrency } from '../../utils/format';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import useAuthStore from '../../store/useAuthStore';
import useVendorStore, {
  ORDER_FILTERS,
  selectStatusCounts,
  selectVisibleOrders,
} from '../../store/useVendorStore';

/** Statuses that mean the shop still owes the order an action. */
const OPEN_STATUSES = ['PENDING', 'ACCEPTED', 'PACKED'];
/** Statuses that mean the goods have left the counter but are not delivered. */
const MOVING_STATUSES = ['READY_FOR_PICKUP', 'IN_TRANSIT'];
/** Terminal states — nothing about these is still owed to anyone. */
const CLOSED_STATUSES = ['DELIVERED', 'CANCELLED'];

/**
 * The vendor flow's home: the order desk.
 *
 * Laid out as a dashboard — identity, then the three figures that decide what
 * the shopkeeper does next, then the filtered queue. The figures are not
 * decoration: "needs you" is the number that gets an order out the door, so it
 * leads, and it is derived from the same flat order list the queue filters,
 * never from a second request.
 *
 * Pull-to-refresh rather than polling — a shop counter runs on a phone that
 * should not be burning battery on a timer. Push (FCM) is the intended wake-up
 * for new orders; this screen only owns the manual path.
 */
export default function VendorOrderListScreen({ navigation }) {
  // Both selectors build a fresh array/object on every call, so they need
  // `useShallow` — a referential comparison would re-render on every store
  // write and trip React's "getSnapshot should be cached" loop guard.
  const orders = useVendorStore(useShallow(selectVisibleOrders));
  const counts = useVendorStore(useShallow(selectStatusCounts));
  // `orders` is the store's own array reference, so a plain selector is
  // correct here — `useShallow` would only add a comparison on every write.
  const allOrders = useVendorStore((state) => state.orders);
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

  const stats = useMemo(() => {
    const needsYou = allOrders.filter((order) => OPEN_STATUSES.includes(order.status)).length;
    const moving = allOrders.filter((order) => MOVING_STATUSES.includes(order.status)).length;
    // Everything still in flight — what the counter is owed once it all lands.
    const value = allOrders
      .filter((order) => !CLOSED_STATUSES.includes(order.status))
      .reduce((sum, order) => sum + (order.totalPrice ?? 0), 0);

    return [
      { value: String(needsYou), label: 'Needs you' },
      { value: String(moving), label: 'On the road' },
      { value: formatCurrency(value), label: 'Open value' },
    ];
  }, [allOrders]);

  const openOrder = useCallback(
    (orderId) => navigation.navigate('VendorOrderDetail', { orderId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => <OrderCard order={item} onPress={() => openOrder(item._id)} />,
    [openOrder]
  );

  // The first load owns the whole screen; every load after it is a quiet
  // refresh control so the list never blanks out under the vendor.
  const showFullScreenSpinner = loading && orders.length === 0 && allOrders.length === 0;
  const activeFilterLabel = ORDER_FILTERS.find((f) => f.key === statusFilter)?.label ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Avatar name={vendorProfile?.shopName ?? 'Your Shop'} size={46} ring />

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>KYA PEHNU? · VENDOR</Text>
          <Text style={styles.title} numberOfLines={1}>
            {vendorProfile?.shopName ?? 'Your Shop'}
          </Text>
        </View>

        <IconButton
          glyph="≡"
          tone="glass"
          size={40}
          onPress={() => navigation.navigate('CatalogManager')}
          accessibilityLabel="Catalog"
        />
        <IconButton
          glyph="○"
          tone="glass"
          size={40}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Profile"
        />
      </View>

      <View style={styles.statRow}>
        {stats.map((stat) => (
          <Surface
            key={stat.label}
            tone="regular"
            radius={radii.lg}
            elevation="low"
            style={styles.statTile}
          >
            {/* Shrink-to-fit: "Open value" can be five digits plus a rupee
                sign in a tile sized for a two-digit count. */}
            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
          </Surface>
        ))}
      </View>

      <SegmentedTabs
        options={ORDER_FILTERS}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
        scrollable
        style={styles.tabs}
      />

      {error ? (
        <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.banner}>
          <Text style={styles.bannerTitle}>Couldn’t reach the store</Text>
          <Text style={styles.bannerBody}>{error}</Text>
        </Surface>
      ) : null}

      {showFullScreenSpinner ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.platinum} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              tintColor={colors.platinum}
              colors={[colors.platinum]}
              progressBackgroundColor={colors.surface}
            />
          }
          ListEmptyComponent={
            <EmptyState
              glyph="◇"
              title="Nothing here yet"
              body={`No orders sitting in ${activeFilterLabel.toLowerCase()}. Pull down to refresh.`}
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
    backgroundColor: colors.transparent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md - 2,
    gap: spacing.xs + 2,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 2,
    color: colors.ash,
  },
  title: {
    ...typography.h2,
    color: colors.ivory,
    marginTop: 3,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  statTile: {
    flex: 1,
    minHeight: 82,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
  },
  statValue: {
    ...typography.numeric,
    fontSize: 22,
    color: colors.ivory,
  },
  statLabel: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.4,
    color: colors.ash,
    marginTop: 5,
  },
  tabs: {
    marginHorizontal: spacing.md,
  },
  banner: {
    padding: spacing.sm + 2,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  bannerTitle: {
    ...typography.h3,
    fontSize: 14,
    color: colors.amber,
  },
  bannerBody: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFlex: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
