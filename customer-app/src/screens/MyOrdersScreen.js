import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OrderTimeline from '../components/OrderTimeline';
import StatusPill from '../components/vendor/StatusPill';
import {
  Avatar,
  EmptyState,
  GlassHeader,
  GLASS_HEADER_HEIGHT,
  PillButton,
  SectionHeader,
  Surface,
  TabDock,
} from '../components/ui';
import { CUSTOMER_TABS, useTabNavigation } from '../navigation/customerTabs';
import { fetchMyOrders, cancelMyOrder } from '../api/vendorApi';
import { formatINR } from '../data/mockStores';
import { isCancellable } from '../utils/orderStatus';
import useAuthStore from '../store/useAuthStore';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

/**
 * MyOrdersScreen
 *
 * The customer's order history, one bento card per order. Refetches on focus
 * (so a status the shop just advanced is there when the buyer comes back) and
 * on pull-to-refresh.
 *
 * Each card leads with the shop and the state, then the money, then the rail —
 * "who has it and where is it" is the question the screen exists to answer, and
 * the item breakdown is a detail below that.
 */
export default function MyOrdersScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setLoaded(true);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      Alert.alert('Could not load orders', err.message);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onCancel = useCallback((order) => {
    Alert.alert('Cancel this order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setCancelling(order._id);
          try {
            const updated = await cancelMyOrder(order._id);
            setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
          } catch (err) {
            Alert.alert('Could not cancel', err.message);
          } finally {
            setCancelling(null);
          }
        },
      },
    ]);
  }, []);

  const onTabChange = useTabNavigation(navigation, 'orders');

  const renderItem = useCallback(
    ({ item }) => {
      const itemCount = item.items?.length ?? 0;

      return (
        <Surface tone="regular" radius={radii.lg} elevation="medium" style={styles.card} sheen>
          <View style={styles.headerRow}>
            <Avatar name={item.vendor?.shopName} size={42} />

            <View style={styles.headerText}>
              <Text style={styles.shop} numberOfLines={1}>
                {item.vendor?.shopName ?? 'Shop'}
              </Text>
              <Text style={styles.meta}>
                #{String(item._id).slice(-6).toUpperCase()} · {itemCount} item
                {itemCount === 1 ? '' : 's'}
              </Text>
            </View>

            <StatusPill status={item.status} />
          </View>

          <View style={styles.moneyRow}>
            <View>
              <Text style={styles.moneyLabel}>TOTAL</Text>
              <Text style={styles.money}>{formatINR(item.totalPrice)}</Text>
            </View>
            <Text style={styles.payment}>
              {item.paymentMethod === 'COD' ? 'Cash on Delivery' : item.paymentMethod}
              {item.paymentStatus === 'PAID' ? ' · Paid' : ''}
            </Text>
          </View>

          <View style={styles.divider} />

          <OrderTimeline status={item.status} />

          {isCancellable(item.status) ? (
            <PillButton
              label="Cancel order"
              variant="ghost"
              size="sm"
              loading={cancelling === item._id}
              onPress={() => onCancel(item)}
              style={styles.cancelBtn}
            />
          ) : null}
        </Surface>
      );
    },
    [cancelling, onCancel]
  );

  const header = <GlassHeader title="My Orders" onBack={() => navigation.goBack()} />;

  if (!isLoggedIn) {
    return (
      <View style={styles.center}>
        <EmptyState
          glyph="○"
          title="Sign in to see your orders"
          body="Your live deliveries and past orders live behind your account."
          actionLabel="Sign in"
          onAction={() => navigation.navigate('Auth', { mode: 'signin' })}
        />
        {header}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: insets.top + GLASS_HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + 96,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          orders.length ? (
            <SectionHeader
              eyebrow="Live status"
              title={orders.length === 1 ? '1 order' : `${orders.length} orders`}
              caption="Straight from the shop counter, the moment it changes."
              style={styles.listHeader}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.platinum}
            colors={[colors.platinum]}
            progressBackgroundColor={colors.surface}
          />
        }
        ListEmptyComponent={
          loading && !loaded ? (
            <ActivityIndicator color={colors.platinum} style={styles.loader} />
          ) : (
            <EmptyState
              glyph="≡"
              title="No orders yet"
              body="Order something from a shop nearby and you can watch it come over on the map."
              actionLabel="Browse nearby"
              onAction={() => navigation.navigate('Home')}
            />
          )
        }
      />

      {header}

      <TabDock items={CUSTOMER_TABS} value="orders" onChange={onTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  list: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  shop: {
    ...typography.h3,
    color: colors.ivory,
  },
  meta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
    marginTop: 3,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  moneyLabel: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.8,
    color: colors.ash,
  },
  money: {
    ...typography.numeric,
    color: colors.ivory,
    marginTop: 3,
  },
  payment: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.md - 2,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.transparent,
  },
  loader: {
    paddingVertical: spacing.xl,
  },
});
