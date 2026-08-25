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

import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import StatusPill from '../components/vendor/StatusPill';
import OrderTimeline from '../components/OrderTimeline';
import { fetchMyOrders, cancelMyOrder } from '../api/vendorApi';
import { formatINR } from '../data/mockStores';
import { isCancellable } from '../utils/orderStatus';
import useAuthStore from '../store/useAuthStore';
import { colors, spacing } from '../theme/colors';

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

  const renderItem = useCallback(
    ({ item }) => (
      <GlassCard compact style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.shop}>{item.vendor?.shopName ?? 'Shop'}</Text>
            <Text style={styles.meta}>
              #{String(item._id).slice(-6).toUpperCase()} · {item.items?.length ?? 0} item
              {item.items?.length === 1 ? '' : 's'} · {formatINR(item.totalPrice)}
            </Text>
            <Text style={styles.payment}>
              {item.paymentMethod === 'COD' ? 'Cash on Delivery' : item.paymentMethod}
              {item.paymentStatus === 'PAID' ? ' · Paid' : ''}
            </Text>
          </View>
          <StatusPill status={item.status} />
        </View>

        <OrderTimeline status={item.status} />

        {isCancellable(item.status) ? (
          <GlassButton
            label="Cancel Order"
            variant="ghost"
            loading={cancelling === item._id}
            onPress={() => onCancel(item)}
            style={styles.cancelBtn}
          />
        ) : null}
      </GlassCard>
    ),
    [cancelling, onCancel]
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Sign in to see your orders</Text>
        <GlassButton
          label="Sign In"
          onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
          style={styles.signIn}
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
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.platinum} />
      }
      ListEmptyComponent={
        loading && !loaded ? (
          <ActivityIndicator color={colors.platinum} style={styles.loader} />
        ) : (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyBody}>Your orders and their live status will show here.</Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  list: { padding: spacing.md, paddingBottom: spacing.xl, flexGrow: 1 },
  card: { marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  headerText: { flex: 1 },
  shop: { color: colors.ivory, fontSize: 16, fontWeight: '400' },
  meta: { color: colors.ash, fontSize: 12, marginTop: 4, letterSpacing: 0.4 },
  payment: { color: colors.slate, fontSize: 11, marginTop: 3, letterSpacing: 0.4 },
  cancelBtn: { marginTop: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.ivory, fontSize: 18, fontWeight: '300' },
  emptyBody: { color: colors.ash, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  signIn: { marginTop: spacing.md, alignSelf: 'stretch' },
  loader: { paddingVertical: spacing.xl },
});
