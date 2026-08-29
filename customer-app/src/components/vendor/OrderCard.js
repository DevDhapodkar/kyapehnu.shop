import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Icon from '../ui/Icon';
import PressableScale from '../ui/PressableScale';
import StatusPill from './StatusPill';
import Surface from '../ui/Surface';
import { colors, radii, spacing } from '../../theme/colors';
import { duration, easing, stagger, type } from '../../theme/tokens';
import {
  formatAddress,
  formatAge,
  formatCurrency,
  shortOrderId,
  summariseItems,
} from '../../utils/format';

/** Statuses where the ball is in the shopkeeper's court. */
const NEEDS_ACTION = ['PENDING', 'ACCEPTED', 'PACKED'];

/**
 * OrderCard
 *
 * One row in the vendor's order queue, built so a shopkeeper can triage it
 * without opening anything: the order's age and status at the top, the garments
 * to pull off the rail in the middle, and the address and amount at the foot.
 *
 * Cards that are waiting on the shopkeeper carry a gold rail down the leading
 * edge. That is the whole triage signal — a queue of twenty orders resolves to
 * "these ones are mine" at a glance, without reading a single status label.
 */
export default function OrderCard({ order, onPress, index = 0 }) {
  const items = order.items ?? [];
  const visibleItems = items.slice(0, 3);
  const overflow = items.length - visibleItems.length;
  const needsAction = NEEDS_ACTION.includes(order.status);

  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index))
        .duration(duration.slow)
        .easing(easing.out)}
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={`Order ${shortOrderId(order._id)}, ${order.status}, ${formatCurrency(order.totalPrice)}`}
        style={styles.pressable}
      >
        <Surface
          padding="compact"
          lift={needsAction ? 'medium' : 'low'}
          accent={needsAction ? colors.gold : undefined}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderId}>{shortOrderId(order._id)}</Text>
              <View style={styles.ageRow}>
                <Icon name="clock" size="xs" color={colors.slate} />
                <Text style={styles.age}>{formatAge(order.createdAt)}</Text>
              </View>
            </View>
            <StatusPill status={order.status} />
          </View>

          <View style={styles.divider} />

          {visibleItems.map((item, itemIndex) => (
            <View
              key={`${item.product ?? item.name}-${item.size}-${itemIndex}`}
              style={styles.itemRow}
            >
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.sizeTag}>
                <Text style={styles.sizeText}>{item.size}</Text>
              </View>
            </View>
          ))}

          {overflow > 0 ? <Text style={styles.overflow}>+{overflow} more</Text> : null}

          <View style={styles.divider} />

          <View style={styles.addressRow}>
            <Icon name="map-pin" size="sm" color={colors.slate} style={styles.addressIcon} />
            <View style={styles.addressBlock}>
              <Text style={styles.addressLabel}>DELIVER TO</Text>
              <Text style={styles.address} numberOfLines={2}>
                {formatAddress(order.deliveryAddress)}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.itemsSummary}>{summariseItems(items)}</Text>
            <Text style={styles.total}>{formatCurrency(order.totalPrice)}</Text>
          </View>
        </Surface>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  orderId: {
    ...type.subheading,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  age: {
    ...type.caption,
    color: colors.slate,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.glassBorder,
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: 4,
  },
  itemQty: {
    ...type.bodySmall,
    color: colors.gold,
    fontWeight: '600',
    width: 26,
    fontVariant: ['tabular-nums'],
  },
  itemName: {
    ...type.body,
    fontSize: 14,
    color: colors.ivory,
    flex: 1,
  },
  sizeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.xs,
    backgroundColor: colors.charcoalLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  sizeText: {
    ...type.caption,
    color: colors.platinum,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  overflow: {
    ...type.caption,
    color: colors.slate,
    marginTop: 4,
    marginLeft: 26,
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    ...type.eyebrow,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  address: {
    ...type.bodySmall,
    color: colors.platinum,
    marginTop: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  itemsSummary: {
    ...type.caption,
    color: colors.ash,
  },
  total: {
    ...type.numeric,
    fontSize: 21,
    fontWeight: '400',
  },
});
