import { Pressable, StyleSheet, Text, View } from 'react-native';

import GlassCard from './GlassCard';
import StatusPill from './StatusPill';
import { colors, spacing } from '../theme/colors';
import { formatAddress, formatAge, formatCurrency, shortOrderId, summariseItems } from '../utils/format';

/**
 * One row in the order queue.
 *
 * Carries everything the vendor needs to triage without opening the order:
 * the item lines (capped at three, with an overflow count), the delivery
 * address the driver will run to, and the amount. Tapping opens the detail
 * screen where the lifecycle actions live.
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
      <GlassCard>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.orderId}>{shortOrderId(order._id)}</Text>
            <Text style={styles.age}>{formatAge(order.createdAt)}</Text>
          </View>
          <StatusPill status={order.status} />
        </View>

        <View style={styles.divider} />

        {visibleItems.map((item, index) => (
          <View key={`${item.product ?? item.name}-${item.size}-${index}`} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}×</Text>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemSize}>{item.size}</Text>
          </View>
        ))}

        {overflow > 0 ? (
          <Text style={styles.overflow}>+{overflow} more</Text>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.addressLabel}>DELIVER TO</Text>
        <Text style={styles.address} numberOfLines={2}>
          {formatAddress(order.deliveryAddress)}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.itemsSummary}>{summariseItems(items)}</Text>
          <Text style={styles.total}>{formatCurrency(order.totalPrice)}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    color: colors.ivory,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  age: {
    color: colors.slate,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 3,
  },
  itemQty: {
    color: colors.platinum,
    fontSize: 13,
    width: 28,
  },
  itemName: {
    color: colors.ivory,
    fontSize: 14,
    flex: 1,
  },
  itemSize: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 1,
  },
  overflow: {
    color: colors.slate,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 4,
    marginLeft: 28,
  },
  addressLabel: {
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  address: {
    color: colors.platinum,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  itemsSummary: {
    color: colors.ash,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  total: {
    color: colors.ivory,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});
