import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import GlassButton from '../../components/GlassButton';
import GlassCard from '../../components/GlassCard';
import StatusPill from '../../components/vendor/StatusPill';
import { fetchOrder } from '../../api/vendorApi';
import { notifySuccess, notifyError } from '../../utils/haptics';
import { colors, spacing } from '../../theme/colors';
import useVendorStore, { selectOrderById } from '../../store/useVendorStore';
import { formatAddress, formatAge, formatCurrency, shortOrderId } from '../../utils/format';

/**
 * Single order, and the only place its lifecycle can be advanced.
 *
 * The two actions are deliberately one-way and unequal in weight:
 *  - Accept Order          — a status write, cheap and reversible in practice.
 *  - Mark Ready for Pickup — dispatches a real Porter driver to the shop and
 *    fires a WhatsApp confirmation. It gets a confirmation dialog and reports
 *    each leg's outcome, because a 200 here can still mean "no driver coming".
 */
export default function VendorOrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;

  const storeOrder = useVendorStore(selectOrderById(orderId));
  const pendingOrderId = useVendorStore((state) => state.pendingOrderId);
  const acceptOrder = useVendorStore((state) => state.acceptOrder);
  const markOrderReady = useVendorStore((state) => state.markOrderReady);
  const advanceStatus = useVendorStore((state) => state.advanceStatus);

  // Deep links (and a cold start from a push notification) can land here with
  // an empty store, so the screen can fetch the order on its own.
  const [fetched, setFetched] = useState(null);
  const [fetching, setFetching] = useState(false);

  const order = storeOrder ?? fetched;
  const busy = pendingOrderId === orderId;

  useEffect(() => {
    if (storeOrder || fetched || fetching) return;

    setFetching(true);
    fetchOrder(orderId)
      .then(setFetched)
      .catch((error) => Alert.alert('Order unavailable', error.message))
      .finally(() => setFetching(false));
  }, [orderId, storeOrder, fetched, fetching]);

  useEffect(() => {
    navigation.setOptions({ title: shortOrderId(orderId) });
  }, [navigation, orderId]);

  const onAccept = useCallback(async () => {
    try {
      await acceptOrder(orderId);
      notifySuccess();
    } catch (error) {
      notifyError();
      Alert.alert('Could not accept', error.message);
    }
  }, [acceptOrder, orderId]);

  const onAdvance = useCallback(
    async (status, failLabel) => {
      try {
        await advanceStatus(orderId, status);
        notifySuccess();
      } catch (error) {
        notifyError();
        Alert.alert(failLabel, error.message);
      }
    },
    [advanceStatus, orderId]
  );

  const onCancel = useCallback(() => {
    Alert.alert('Cancel this order?', 'The customer will be notified. This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => onAdvance('CANCELLED', 'Could not cancel'),
      },
    ]);
  }, [onAdvance]);

  const onMarkReady = useCallback(() => {
    Alert.alert(
      'Dispatch a driver?',
      'This books a Porter pickup at your store and sends you a WhatsApp confirmation.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Mark Ready',
          style: 'destructive',
          onPress: async () => {
            try {
              const { logistics } = await markOrderReady(orderId);
              // A 200 can still mean "no driver coming" — let the haptic match the
              // real outcome, not just that the request returned.
              if (logistics.porter.ok) notifySuccess();
              else notifyError();
              const lines = [
                logistics.porter.ok
                  ? '✓ Porter driver dispatched'
                  : `✕ Porter failed — ${logistics.porter.error}`,
                logistics.whatsapp.ok
                  ? '✓ WhatsApp confirmation sent'
                  : `✕ WhatsApp failed — ${logistics.whatsapp.error}`,
              ];

              Alert.alert(
                logistics.porter.ok ? 'Pickup booked' : 'Marked ready, no driver yet',
                lines.join('\n')
              );
            } catch (error) {
              notifyError();
              Alert.alert('Could not mark ready', error.message);
            }
          },
        },
      ]
    );
  }, [markOrderReady, orderId]);

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.platinum} />
      </View>
    );
  }

  const items = order.items ?? [];
  const { status } = order;
  // Cancel stays available until the shop has handed the goods over.
  const canCancel = ['PENDING', 'ACCEPTED', 'PACKED'].includes(status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.orderId}>{shortOrderId(order._id)}</Text>
          <Text style={styles.age}>Placed {formatAge(order.createdAt)}</Text>
        </View>
        <StatusPill status={order.status} />
      </View>

      <GlassCard compact style={styles.card}>
        <Text style={styles.sectionLabel}>ITEM BREAKDOWN</Text>

        {items.map((item, index) => (
          <View key={`${item.product ?? item.name}-${item.size}-${index}`} style={styles.lineRow}>
            <View style={styles.lineMain}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.lineMeta}>
                Size {item.size} · {item.quantity} × {formatCurrency(item.price)}
              </Text>
            </View>
            <Text style={styles.lineTotal}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>ORDER TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.totalPrice)}</Text>
        </View>
      </GlassCard>

      <GlassCard compact style={styles.card}>
        <Text style={styles.sectionLabel}>DELIVERY</Text>
        <Text style={styles.address}>{formatAddress(order.deliveryAddress)}</Text>

        {order.customer?.name || order.guestContact?.name ? (
          <Text style={styles.customer}>
            {order.customer?.name || order.guestContact?.name}
            {order.customer?.phone || order.guestContact?.phone
              ? ` · ${order.customer?.phone || order.guestContact?.phone}`
              : ''}
            {order.channel === 'WEB' ? '  · web' : ''}
          </Text>
        ) : null}
      </GlassCard>

      {order.porter?.requestId ? (
        <GlassCard compact style={styles.card}>
          <Text style={styles.sectionLabel}>PORTER</Text>
          <Text style={styles.address}>Request {order.porter.requestId}</Text>
          {order.porter.driverName ? (
            <Text style={styles.customer}>
              {order.porter.driverName}
              {order.porter.driverPhone ? ` · ${order.porter.driverPhone}` : ''}
            </Text>
          ) : (
            <Text style={styles.customer}>Waiting for a driver to be assigned</Text>
          )}
        </GlassCard>
      ) : null}

      <View style={styles.actions}>
        {status === 'PENDING' ? (
          <GlassButton label="Accept Order" onPress={onAccept} loading={busy} />
        ) : null}

        {status === 'ACCEPTED' ? (
          <GlassButton
            label="Mark Packed"
            caption="You've packed this order"
            onPress={() => onAdvance('PACKED', 'Could not update')}
            loading={busy}
          />
        ) : null}

        {status === 'PACKED' ? (
          <GlassButton
            label="Mark Ready for Pickup"
            caption="Dispatches a Porter driver (if configured)"
            onPress={onMarkReady}
            loading={busy}
          />
        ) : null}

        {status === 'READY_FOR_PICKUP' ? (
          <GlassButton
            label="Mark Out for Delivery"
            caption="Driver has picked up the order"
            onPress={() => onAdvance('IN_TRANSIT', 'Could not update')}
            loading={busy}
          />
        ) : null}

        {status === 'IN_TRANSIT' ? (
          <GlassButton
            label="Mark Delivered"
            caption="Collect Cash on Delivery"
            onPress={() => onAdvance('DELIVERED', 'Could not update')}
            loading={busy}
          />
        ) : null}

        {canCancel ? (
          <GlassButton label="Cancel Order" variant="ghost" onPress={onCancel} loading={busy} />
        ) : null}

        {status === 'DELIVERED' ? (
          <Text style={styles.terminal}>Delivered — payment collected. ✓</Text>
        ) : null}
        {status === 'CANCELLED' ? (
          <Text style={styles.terminal}>This order was cancelled.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.obsidian,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderId: {
    color: colors.ivory,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 1.5,
  },
  age: {
    color: colors.slate,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  card: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    gap: spacing.sm,
  },
  lineMain: {
    flex: 1,
  },
  lineName: {
    color: colors.ivory,
    fontSize: 15,
  },
  lineMeta: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 3,
  },
  lineTotal: {
    color: colors.platinum,
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 2,
  },
  totalValue: {
    color: colors.ivory,
    fontSize: 24,
    fontWeight: '300',
  },
  address: {
    color: colors.ivory,
    fontSize: 14,
    lineHeight: 21,
  },
  customer: {
    color: colors.ash,
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  terminal: {
    color: colors.slate,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
