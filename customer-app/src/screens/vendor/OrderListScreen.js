import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import FilterTabs from '../../components/vendor/FilterTabs';
import GlassCard from '../../components/GlassCard';
import OrderCard from '../../components/vendor/OrderCard';
import PressableScale from '../../components/PressableScale';
import { colors, spacing } from '../../theme/colors';
import useAuthStore from '../../store/useAuthStore';
import useVendorStore, {
  ORDER_FILTERS,
  selectStatusCounts,
  selectVisibleOrders,
} from '../../store/useVendorStore';

/**
 * The vendor flow's home: every incoming order, filtered by where it sits in
 * the lifecycle. Pull-to-refresh rather than polling — a shop counter runs on a
 * phone that should not be burning battery on a timer. Push (FCM) is the
 * intended wake-up for new orders; this screen only owns the manual path.
 */
export default function VendorOrderListScreen({ navigation }) {
  // Both selectors build a fresh array/object on every call, so they need
  // `useShallow` — a referential comparison would re-render on every store
  // write and trip React's "getSnapshot should be cached" loop guard.
  const orders = useVendorStore(useShallow(selectVisibleOrders));
  const counts = useVendorStore(useShallow(selectStatusCounts));
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
  const showFullScreenSpinner = loading && orders.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>KYA PEHNU? · VENDOR</Text>
          <Text style={styles.title} numberOfLines={1}>
            {vendorProfile?.shopName ?? 'Your Shop'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <HeaderButton label="CATALOG" onPress={() => navigation.navigate('CatalogManager')} />
          <HeaderButton label="PROFILE" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>

      <FilterTabs
        options={ORDER_FILTERS}
        value={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
      />

      {error ? (
        <GlassCard strong compact style={styles.banner}>
          <Text style={styles.bannerTitle}>Couldn’t reach the store</Text>
          <Text style={styles.bannerBody}>{error}</Text>
        </GlassCard>
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
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              tintColor={colors.platinum}
              colors={[colors.platinum]}
              progressBackgroundColor={colors.charcoal}
            />
          }
          ListEmptyComponent={
            <GlassCard style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                No orders sitting in{' '}
                {ORDER_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase()}. Pull down
                to refresh.
              </Text>
            </GlassCard>
          }
        />
      )}
    </SafeAreaView>
  );
}

function HeaderButton({ label, onPress }) {
  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      accessibilityLabel={label}
      style={styles.headerButton}
    >
      <Text style={styles.headerButtonText}>{label}</Text>
    </PressableScale>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2.4,
  },
  title: {
    color: colors.ivory,
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  headerButtonText: {
    color: colors.platinum,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  banner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  bannerTitle: {
    color: colors.ivory,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  bannerBody: {
    color: colors.ash,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
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
  empty: {
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: colors.ivory,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  emptyBody: {
    color: colors.ash,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
