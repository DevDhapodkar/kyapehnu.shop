import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import OrderTimeline from '../../components/OrderTimeline';
import StatusPill from '../../components/vendor/StatusPill';
import {
  Button,
  Divider,
  Icon,
  Surface,
} from '../../components/ui';
import { fetchOrder } from '../../api/vendorApi';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, stagger, type } from '../../theme/tokens';
import { useVendorStore, selectOrderById } from '../../store/useVendorStore';
import { formatAddress, formatAge, formatCurrency, shortOrderId } from '../../utils/format';
import { success, warn } from '../../utils/haptics';

/** Cancel stays available until the shop has handed the goods over. */
const CANCELLABLE = ['PENDING', 'ACCEPTED', 'PACKED'];

/**
 * Single order, and the only place its lifecycle can be advanced.
 *
 * The two actions are deliberately one-way and unequal in weight:
 *  - Accept Order          — a status write, cheap and reversible in practice.
 *  - Mark Ready for Pickup — dispatches a real Porter driver to the shop and
 *    fires a WhatsApp confirmation. It gets a confirmation dialog and reports
 *    each leg's outcome, because a 200 here can still mean "no driver coming".
 *
 * Only ever *one* forward action is on screen. A shopkeeper working a counter
 * should never have to decide which of several buttons is the next step — the
 * screen already knows, and shows exactly that one.
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
  // The in-flight guard is a ref, not state: nothing renders from it, and
  // setting state synchronously inside an effect body is a cascading render
  // the React Compiler rejects.
  const fetching = useRef(false);

  const order = storeOrder ?? fetched;
  const busy = pendingOrderId === orderId;

  useEffect(() => {
    if (storeOrder || fetched || fetching.current) return;

    fetching.current = true;
    fetchOrder(orderId)
      .then(setFetched)
      .catch((error) => Alert.alert('Order unavailable', error.message))
      .finally(() => {
        fetching.current = false;
      });
  }, [orderId, storeOrder, fetched]);

  useEffect(() => {
    navigation.setOptions({ title: shortOrderId(orderId) });
  }, [navigation, orderId]);

  const onAccept = useCallback(async () => {
    try {
      await acceptOrder(orderId);
      success();
    } catch (error) {
      Alert.alert('Could not accept', error.message);
    }
  }, [acceptOrder, orderId]);

  const onAdvance = useCallback(
    async (status, failLabel) => {
      try {
        await advanceStatus(orderId, status);
        success();
      } catch (error) {
        Alert.alert(failLabel, error.message);
      }
    },
    [advanceStatus, orderId]
  );

  const onCancel = useCallback(() => {
    warn();
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

              if (logistics.porter.ok) success();
              else warn();

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

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.platinum} />
        <Text style={styles.loadingText}>Fetching order…</Text>
      </View>
    );
  }

  const items = order.items ?? [];
  const { status } = order;

  // The single forward step available from this state. Keeping it as a lookup
  // rather than a ladder of conditionals means a new lifecycle stage is one
  // entry here, not another branch in the render.
  const NEXT_STEP = {
    PENDING: { label: 'Accept order', icon: 'check', onPress: onAccept },
    ACCEPTED: {
      label: 'Mark packed',
      icon: 'package',
      caption: "You've packed this order",
      onPress: () => onAdvance('PACKED', 'Could not update'),
    },
    PACKED: {
      label: 'Mark ready for pickup',
      icon: 'shopping-bag',
      caption: 'Dispatches a Porter driver (if configured)',
      onPress: onMarkReady,
    },
    READY_FOR_PICKUP: {
      label: 'Mark out for delivery',
      icon: 'navigation',
      caption: 'Driver has picked up the order',
      onPress: () => onAdvance('IN_TRANSIT', 'Could not update'),
    },
    IN_TRANSIT: {
      label: 'Mark delivered',
      icon: 'check-circle',
      caption: 'Collect Cash on Delivery',
      onPress: () => onAdvance('DELIVERED', 'Could not update'),
    },
  };

  const next = NEXT_STEP[status];
  const canCancel = CANCELLABLE.includes(status);
  const customerName = order.customer?.name || order.guestContact?.name;
  const customerPhone = order.customer?.phone || order.guestContact?.phone;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.duration(duration.slow).easing(easing.out)}
        style={styles.headerRow}
      >
        <View>
          <Text style={styles.orderId}>{shortOrderId(order._id)}</Text>
          <View style={styles.ageRow}>
            <Icon name="clock" size="xs" color={colors.slate} />
            <Text style={styles.age}>Placed {formatAge(order.createdAt)}</Text>
          </View>
        </View>
        <StatusPill status={status} />
      </Animated.View>

      <Card index={0}>
        <Text style={styles.sectionLabel}>WHERE IT IS</Text>
        <OrderTimeline status={status} />
      </Card>

      <Card index={1}>
        <Text style={styles.sectionLabel}>ITEM BREAKDOWN</Text>

        {items.map((item, index) => (
          <View key={`${item.product ?? item.name}-${item.size}-${index}`} style={styles.lineRow}>
            <View style={styles.lineQty}>
              <Text style={styles.lineQtyText}>{item.quantity}×</Text>
            </View>

            <View style={styles.lineMain}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.lineMeta}>
                Size {item.size} · {formatCurrency(item.price)} each
              </Text>
            </View>

            <Text style={styles.lineTotal}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
        ))}

        <Divider spacingY={spacing.sm} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>ORDER TOTAL</Text>
            <Text style={styles.totalMeta}>
              {order.paymentMethod === 'COD' ? 'Collect on delivery' : order.paymentMethod}
            </Text>
          </View>
          <Text style={styles.totalValue}>{formatCurrency(order.totalPrice)}</Text>
        </View>
      </Card>

      <Card index={2}>
        <Text style={styles.sectionLabel}>DELIVERY</Text>

        <View style={styles.metaRow}>
          <Icon name="map-pin" size="sm" color={colors.gold} style={styles.metaIcon} />
          <Text style={styles.address}>{formatAddress(order.deliveryAddress)}</Text>
        </View>

        {customerName ? (
          <View style={styles.metaRow}>
            <Icon name="user" size="sm" color={colors.slate} style={styles.metaIcon} />
            <Text style={styles.customer}>
              {customerName}
              {customerPhone ? ` · ${customerPhone}` : ''}
              {order.channel === 'WEB' ? '  · web' : ''}
            </Text>
          </View>
        ) : null}
      </Card>

      {order.porter?.requestId ? (
        <Card index={3}>
          <Text style={styles.sectionLabel}>PORTER</Text>

          <View style={styles.metaRow}>
            <Icon name="hash" size="sm" color={colors.slate} style={styles.metaIcon} />
            <Text style={styles.address}>Request {order.porter.requestId}</Text>
          </View>

          <View style={styles.metaRow}>
            <Icon name="truck" size="sm" color={colors.slate} style={styles.metaIcon} />
            <Text style={styles.customer}>
              {order.porter.driverName
                ? `${order.porter.driverName}${
                    order.porter.driverPhone ? ` · ${order.porter.driverPhone}` : ''
                  }`
                : 'Waiting for a driver to be assigned'}
            </Text>
          </View>
        </Card>
      ) : null}

      <View style={styles.actions}>
        {next ? (
          <Button
            label={next.label}
            icon={next.icon}
            caption={next.caption}
            onPress={next.onPress}
            loading={busy}
            size="lg"
            fullWidth
          />
        ) : null}

        {canCancel ? (
          <Button
            label="Cancel order"
            icon="x-circle"
            variant="danger"
            onPress={onCancel}
            loading={busy}
            fullWidth
          />
        ) : null}

        {status === 'DELIVERED' ? (
          <Terminal
            icon="check-circle"
            tone="jade"
            text="Delivered — payment collected."
          />
        ) : null}

        {status === 'CANCELLED' ? (
          <Terminal icon="x-circle" tone="crimson" text="This order was cancelled." />
        ) : null}
      </View>
    </ScrollView>
  );
}

/** A staggered card, so the detail assembles top-down rather than snapping in. */
function Card({ children, index }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index + 1))
        .duration(duration.slow)
        .easing(easing.out)}
      style={styles.card}
    >
      <Surface padding="default" lift="low">
        {children}
      </Surface>
    </Animated.View>
  );
}

/** The closing line on an order that has nowhere left to go. */
function Terminal({ icon, text, tone }) {
  const tint = tone === 'jade' ? colors.jade : colors.crimsonGlow;

  return (
    <View
      style={[
        styles.terminal,
        {
          backgroundColor: tone === 'jade' ? colors.jadeWash : colors.crimsonWashSoft,
          borderColor: tone === 'jade' ? 'rgba(78, 140, 106, 0.32)' : 'rgba(196, 36, 58, 0.3)',
        },
      ]}
    >
      <Icon name={icon} size="sm" color={tint} />
      <Text style={[styles.terminalText, { color: tint }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.obsidian,
  },
  loadingText: {
    ...type.caption,
    color: colors.slate,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
    gap: spacing.sm,
  },
  orderId: {
    ...type.title,
    fontSize: 28,
    letterSpacing: 1.4,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  age: {
    ...type.caption,
    color: colors.slate,
  },
  card: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
    marginBottom: spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: 7,
  },
  lineQty: {
    minWidth: 32,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.xs,
    alignItems: 'center',
    backgroundColor: colors.goldWashSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(200, 162, 74, 0.26)',
  },
  lineQtyText: {
    ...type.caption,
    color: colors.gold,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  lineMain: {
    flex: 1,
  },
  lineName: {
    ...type.subheading,
    fontSize: 15,
    fontWeight: '400',
  },
  lineMeta: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
  },
  lineTotal: {
    ...type.numeric,
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
  },
  totalMeta: {
    ...type.caption,
    color: colors.ash,
    marginTop: 3,
  },
  totalValue: {
    ...type.numericLarge,
    fontSize: 26,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  metaIcon: {
    marginTop: 2,
  },
  address: {
    ...type.body,
    fontSize: 14,
    color: colors.ivory,
    flex: 1,
  },
  customer: {
    ...type.caption,
    color: colors.ash,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    marginTop: spacing.m,
    gap: spacing.sm,
  },
  terminal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.m,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  terminalText: {
    ...type.bodySmall,
  },
});
