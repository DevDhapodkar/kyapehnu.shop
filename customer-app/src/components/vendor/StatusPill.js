import { StyleSheet, Text, View } from 'react-native';

import Icon from '../ui/Icon';
import LiveDot from '../ui/LiveDot';
import { colors, radii, spacing, statusColors, statusIcons, statusLabels } from '../../theme/colors';
import { type } from '../../theme/tokens';

/**
 * StatusPill
 *
 * An order's state, tinted from the palette's `statusColors` map: low alpha on
 * the fill, full strength on the border and label, so the pill reads as tinted
 * glass rather than as a solid badge competing with the card it sits on.
 *
 * States where something is physically moving (a driver en route, a pickup
 * waiting) carry a live pulse instead of a static glyph — the pill then tells
 * the shopkeeper not just what the order is, but whether it is their move.
 */
const LIVE_STATES = ['READY_FOR_PICKUP', 'IN_TRANSIT'];

export default function StatusPill({ status, size = 'md', style }) {
  const tint = statusColors[status] ?? colors.ash;
  const live = LIVE_STATES.includes(status);
  const compact = size === 'sm';

  return (
    <View
      style={[styles.pill, compact && styles.pillCompact, { borderColor: tint }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${statusLabels[status] ?? status ?? 'Unknown'}`}
    >
      <View pointerEvents="none" style={[styles.tintFill, { backgroundColor: tint }]} />

      {live ? (
        <LiveDot size={5} color={tint} style={styles.live} />
      ) : (
        <Icon name={statusIcons[status] ?? 'circle'} size={compact ? 10 : 12} color={tint} />
      )}

      <Text style={[styles.label, compact && styles.labelCompact, { color: tint }]}>
        {(statusLabels[status] ?? status ?? 'Unknown').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.s + 2,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  pillCompact: {
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    gap: 4,
  },
  tintFill: {
    ...StyleSheet.absoluteFill,
    opacity: 0.13,
  },
  live: {
    // LiveDot reserves 3× its size for the halo; pull that back so the pill
    // does not gain a block of empty space beside the label.
    marginHorizontal: -4,
  },
  label: {
    ...type.label,
    fontSize: 10,
    letterSpacing: 1.3,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 1,
  },
});
