import { Pressable, StyleSheet, Text, View } from 'react-native';

import StatusPill from './StatusPill';
import { Chip, Surface } from '../ui';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  formatAddress,
  formatAge,
  formatCurrency,
  shortOrderId,
  summariseItems,
} from '../../utils/format';

/**
 * One row in the vendor's order queue.
 *
 * Carries everything needed to triage without opening the order: the item
 * lines (capped at three, with an overflow count), the delivery address the
 * driver will run to, and the amount. Tapping opens the detail screen where
 * the lifecycle actions live.
 *
 * The money sits bottom-right at display weight because it is the figure a
 * shopkeeper scans a queue for, and the order id — which only matters once
 * you are already talking about one specific order — is small and grey.
 */
export default function OrderCard({ order, onPress }) {
  const items = order.items ?? [];
  const visibleItems = items.slice(0, 3);
  const overflow = items.length - visibleItems.length;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${shortOrderId(order._id)}, ${order.status}`}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <Surface tone="surface" radius={radii.lg} elevation="medium" style={styles.card} sheen>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.orderId}>{shortOrderId(order._id)}</Text>
            <Text style={styles.age}>{formatAge(order.createdAt)}</Text>
          </View>
          <StatusPill status={order.status} />
        </View>

        <View style={styles.items}>
          {visibleItems.map((item, index) => (
            <View
              key={`${item.product ?? item.name}-${item.size}-${index}`}
              style={styles.itemRow}
            >
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Chip label={item.size} size="sm" tone="surface" />
            </View>
          ))}

          {overflow > 0 ? <Text style={styles.overflow}>+{overflow} more</Text> : null}
        </View>

        <View style={styles.divider} />

        <Text style={styles.addressLabel}>DELIVER TO</Text>
        <Text style={styles.address} numberOfLines={2}>
          {formatAddress(order.deliveryAddress)}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.itemsSummary}>{summariseItems(items)}</Text>
          <Text style={styles.total}>{formatCurrency(order.totalPrice)}</Text>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    padding: spacing.md - 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  orderId: {
    ...typography.h3,
    letterSpacing: 1.4,
    color: colors.platinum,
  },
  age: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
    marginTop: 2,
  },
  items: {
    marginTop: spacing.sm + 2,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemQty: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ash,
    width: 28,
  },
  itemName: {
    ...typography.body,
    color: colors.ivory,
    flex: 1,
  },
  overflow: {
    ...typography.caption,
    fontSize: 11,
    color: colors.slate,
    marginLeft: 28,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm + 2,
  },
  addressLabel: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.8,
    color: colors.ash,
  },
  address: {
    ...typography.caption,
    fontSize: 13,
    color: colors.platinum,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm + 2,
  },
  itemsSummary: {
    ...typography.caption,
    fontSize: 11,
    color: colors.ash,
  },
  total: {
    ...typography.numericLg,
    fontSize: 26,
    color: colors.ivory,
  },
});
