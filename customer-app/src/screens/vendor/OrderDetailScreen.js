import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StatusPill from '../../components/vendor/StatusPill';
import OrderTimeline from '../../components/OrderTimeline';
import {
  Avatar,
  Chip,
  GlassHeader,
  GLASS_HEADER_HEIGHT,
  PillButton,
  Surface,
} from '../../components/ui';
import { fetchOrder } from '../../api/vendorApi';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
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
  const insets = useSafeAreaInsets();
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

  const onAccept = useCallback(async () => {
    try {
      await acceptOrder(orderId);
    } catch (error) {
      Alert.alert('Could not accept', error.message);
    }
  }, [acceptOrder, orderId]);

  const onAdvance = useCallback(
    async (status, failLabel) => {
      try {
        await advanceStatus(orderId, status);
      } catch (error) {
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
              Alert.alert('Could not mark ready', error.message);
            }
          },
        },
      ]
    );
  }, [markOrderReady, orderId]);

  const header = <GlassHeader title="Order" onBack={() => navigation.goBack()} />;

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.platinum} />
        {header}
      </View>
    );
  }

  const items = order.items ?? [];
  const { status } = order;
  // Cancel stays available until the shop has handed the goods over.
  const canCancel = ['PENDING', 'ACCEPTED', 'PACKED'].includes(status);

  // A guest checkout carries its contact inline rather than on a User document.
  const customerName = order.customer?.name || order.guestContact?.name || '';
  const customerPhone = order.customer?.phone || order.guestContact?.phone || '';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + GLASS_HEADER_HEIGHT + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.orderId}>{shortOrderId(order._id)}</Text>
            <Text style={styles.age}>Placed {formatAge(order.createdAt)}</Text>
          </View>
          <StatusPill status={order.status} />
        </View>

        <Surface tone="regular" radius={radii.xl} elevation="medium" style={styles.card} sheen>
          <Text style={styles.sectionLabel}>ITEM BREAKDOWN</Text>

          {items.map((item, index) => (
            <View key={`${item.product ?? item.name}-${item.size}-${index}`} style={styles.lineRow}>
              <View style={styles.lineMain}>
                <Text style={styles.lineName}>{item.name}</Text>
                <Text style={styles.lineMeta}>
                  {item.quantity} × {formatCurrency(item.price)}
                </Text>
              </View>
              <Chip label={item.size} size="sm" tone="thin" />
              <Text style={styles.lineTotal}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.sectionLabel}>ORDER TOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalPrice)}</Text>
          </View>
        </Surface>

        <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.card}>
          <Text style={styles.sectionLabel}>PROGRESS</Text>
          <OrderTimeline status={order.status} />
        </Surface>

        <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.card}>
          <Text style={styles.sectionLabel}>DELIVERY</Text>

          <View style={styles.personRow}>
            <Avatar name={customerName} size={42} />
            <View style={styles.personText}>
              {customerName ? (
                <Text style={styles.personName} numberOfLines={1}>
                  {customerName}
                </Text>
              ) : null}
              <Text style={styles.address}>{formatAddress(order.deliveryAddress)}</Text>
            </View>
          </View>

          {customerPhone || order.channel === 'WEB' ? (
            <View style={styles.metaChips}>
              {customerPhone ? <Chip label={customerPhone} size="sm" tone="thin" /> : null}
              {order.channel === 'WEB' ? <Chip label="Web order" size="sm" tone="thin" /> : null}
            </View>
          ) : null}
        </Surface>

        {order.porter?.requestId ? (
          <Surface tone="regular" radius={radii.lg} elevation="low" style={styles.card}>
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
          </Surface>
        ) : null}

        <View style={styles.actions}>
          {status === 'PENDING' ? (
            <PillButton label="Accept order" icon="✓" size="lg" full onPress={onAccept} loading={busy} />
          ) : null}

          {status === 'ACCEPTED' ? (
            <PillButton
              label="Mark packed"
              caption="You've packed this order"
              icon="→"
              size="lg"
              full
              onPress={() => onAdvance('PACKED', 'Could not update')}
              loading={busy}
            />
          ) : null}

          {status === 'PACKED' ? (
            // The one action on this screen that reaches outside the app — it
            // books a real driver — so it takes the accent the rest do not.
            <PillButton
              label="Mark ready for pickup"
              caption="Dispatches a Porter driver (if configured)"
              variant="gradient"
              icon="→"
              size="lg"
              full
              onPress={onMarkReady}
              loading={busy}
            />
          ) : null}

          {status === 'READY_FOR_PICKUP' ? (
            <PillButton
              label="Mark out for delivery"
              caption="Driver has picked up the order"
              icon="→"
              size="lg"
              full
              onPress={() => onAdvance('IN_TRANSIT', 'Could not update')}
              loading={busy}
            />
          ) : null}

          {status === 'IN_TRANSIT' ? (
            <PillButton
              label="Mark delivered"
              caption="Collect Cash on Delivery"
              icon="✓"
              size="lg"
              full
              onPress={() => onAdvance('DELIVERED', 'Could not update')}
              loading={busy}
            />
          ) : null}

          {canCancel ? (
            <PillButton
              label="Cancel order"
              variant="ghost"
              full
              onPress={onCancel}
              loading={busy}
            />
          ) : null}

          {status === 'DELIVERED' ? (
            <Text style={styles.terminal}>Delivered — payment collected.</Text>
          ) : null}
          {status === 'CANCELLED' ? (
            <Text style={styles.terminal}>This order was cancelled.</Text>
          ) : null}
        </View>
      </ScrollView>

      {header}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.transparent,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    ...typography.h1,
    letterSpacing: 1.2,
    color: colors.ivory,
  },
  age: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
    marginTop: 4,
  },
  card: {
    padding: spacing.md - 2,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.8,
    color: colors.ash,
    marginBottom: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    gap: spacing.xs + 2,
  },
  lineMain: {
    flex: 1,
    minWidth: 0,
  },
  lineName: {
    ...typography.bodyLg,
    color: colors.ivory,
  },
  lineMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
    marginTop: 3,
  },
  lineTotal: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '600',
    color: colors.platinum,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm + 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValue: {
    ...typography.numericLg,
    fontSize: 28,
    color: colors.ivory,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personText: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    ...typography.h3,
    color: colors.ivory,
    marginBottom: 3,
  },
  address: {
    ...typography.caption,
    fontSize: 13,
    color: colors.platinum,
  },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
  customer: {
    ...typography.caption,
    color: colors.ash,
    marginTop: 6,
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  terminal: {
    ...typography.caption,
    color: colors.slate,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
