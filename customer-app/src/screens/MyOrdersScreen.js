import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

import OrderTimeline from '../components/OrderTimeline';
import StatusPill from '../components/vendor/StatusPill';
import {
  Button,
  Divider,
  EmptyState,
  Icon,
  Skeleton,
  StatRow,
  StatTile,
  Surface,
} from '../components/ui';
import { fetchMyOrders, cancelMyOrder } from '../api/vendorApi';
import { formatINR } from '../data/mockStores';
import { isCancellable } from '../utils/orderStatus';
import { formatAge, shortOrderId } from '../utils/format';
import { useAuthStore } from '../store/useAuthStore';
import { colors, spacing } from '../theme/colors';
import { duration, easing, stagger, type } from '../theme/tokens';

/** States where the order is still moving through fulfilment. */
const OPEN_STATES = ['PENDING', 'ACCEPTED', 'PACKED', 'READY_FOR_PICKUP', 'IN_TRANSIT'];

/**
 * The customer's order history and live status. Refetches on focus (so a status
 * a vendor just advanced shows up when the buyer returns to the tab) and on
 * pull-to-refresh. Each card carries the fulfilment timeline and, while the
 * order is still cancellable, a cancel action.
 */
export default function MyOrdersScreen({ navigation }) {
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

  // The header answers the question the screen is opened to ask — "is anything
  // on its way right now?" — before any individual card has to be read.
  const summary = useMemo(() => {
    const open = orders.filter((o) => OPEN_STATES.includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
    const spent = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);
    return { open, delivered, spent };
  }, [orders]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <Animated.View
        entering={FadeInDown.delay(stagger(index)).duration(duration.slow).easing(easing.out)}
        style={styles.cardWrap}
      >
        <Surface padding="compact" lift="low">
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.shop}>{item.vendor?.shopName ?? 'Shop'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.orderId}>{shortOrderId(item._id)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.meta}>{formatAge(item.createdAt)}</Text>
              </View>
            </View>
            <StatusPill status={item.status} size="sm" />
          </View>

          <Divider spacingY={spacing.sm} />

          <View style={styles.factRow}>
            <Fact
              icon="package"
              value={`${item.items?.length ?? 0} ${item.items?.length === 1 ? 'item' : 'items'}`}
            />
            <Fact
              icon="credit-card"
              value={item.paymentMethod === 'COD' ? 'Cash on delivery' : item.paymentMethod}
              tone={item.paymentStatus === 'PAID' ? 'jade' : 'neutral'}
            />
            <Text style={styles.total}>{formatINR(item.totalPrice)}</Text>
          </View>

          <Divider spacingY={spacing.sm} />

          <OrderTimeline status={item.status} />

          {isCancellable(item.status) ? (
            <Button
              label="Cancel order"
              icon="x-circle"
              variant="danger"
              size="sm"
              loading={cancelling === item._id}
              onPress={() => onCancel(item)}
              style={styles.cancelBtn}
            />
          ) : null}
        </Surface>
      </Animated.View>
    ),
    [cancelling, onCancel]
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="lock"
          title="Sign in to see your orders"
          body="Your live deliveries and order history are tied to your account."
          actionLabel="Sign in"
          onAction={() => navigation.navigate('Auth', { mode: 'signin' })}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={orders}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        orders.length > 0 ? (
          <Surface tone="sunken" padding="compact" lift="flat" style={styles.summaryCard}>
            <StatRow>
              <StatTile
                icon="truck"
                value={String(summary.open)}
                label={summary.open === 1 ? 'on the way' : 'on the way'}
                emphasis={summary.open > 0 ? 'crimson' : 'muted'}
              />
              <StatTile
                icon="check-circle"
                value={String(summary.delivered)}
                label="delivered"
                emphasis="jade"
              />
              <StatTile
                icon="trending-up"
                value={formatINR(summary.spent)}
                label="lifetime"
                emphasis="gold"
              />
            </StatRow>
          </Surface>
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={loading && loaded}
          onRefresh={load}
          tintColor={colors.platinum}
          colors={[colors.crimsonBright]}
          progressBackgroundColor={colors.charcoal}
        />
      }
      ListEmptyComponent={
        loading && !loaded ? (
          <OrderSkeletons />
        ) : (
          <EmptyState
            icon="package"
            title="No orders yet"
            body="Place your first order and you will be able to watch the rider cross the city from here."
            actionLabel="Start browsing"
            onAction={() => navigation.navigate('Home')}
          />
        )
      }
    />
  );
}

/** One glyph-and-value pair on an order card. */
function Fact({ icon, value, tone = 'neutral' }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size="xs" color={tone === 'jade' ? colors.jade : colors.slate} />
      <Text style={[styles.factText, tone === 'jade' && styles.factTextJade]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** Cold-load placeholders, shaped like the cards they stand in for. */
function OrderSkeletons() {
  return (
    <View>
      {[0, 1, 2].map((index) => (
        <Surface key={index} padding="compact" lift="low" style={styles.cardWrap}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="35%" height={11} style={styles.skeletonGap} />
            </View>
            <Skeleton width={82} height={22} radius="pill" />
          </View>
          <Divider spacingY={spacing.sm} />
          <Skeleton width="100%" height={11} />
          <Skeleton width="70%" height={11} style={styles.skeletonGap} />
        </Surface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  list: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  summaryCard: {
    marginBottom: spacing.sm,
  },
  cardWrap: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  headerText: {
    flex: 1,
  },
  shop: {
    ...type.subheading,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  orderId: {
    ...type.caption,
    color: colors.gold,
    letterSpacing: 1,
  },
  metaDot: {
    ...type.caption,
    color: colors.slate,
  },
  meta: {
    ...type.caption,
    color: colors.ash,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  factText: {
    ...type.caption,
    color: colors.ash,
    flexShrink: 1,
  },
  factTextJade: {
    color: colors.jade,
  },
  total: {
    ...type.numeric,
    fontSize: 17,
    marginLeft: 'auto',
  },
  cancelBtn: {
    marginTop: spacing.s,
  },
  center: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'center',
  },
  skeletonGap: {
    marginTop: spacing.s,
  },
});
