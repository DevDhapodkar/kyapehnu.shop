import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, statusColors, statusLabels } from '../theme/colors';

/**
 * Order status chip. The tint comes from the palette's `statusColors` map and
 * is applied at low alpha to the fill and full strength to the border and
 * label, so the pill reads as tinted glass rather than a solid badge.
 */
export default function StatusPill({ status, style }) {
  const tint = statusColors[status] ?? colors.ash;

  return (
    <View style={[styles.pill, { borderColor: tint }, style]}>
      <View pointerEvents="none" style={[styles.tintFill, { backgroundColor: tint }]} />
      <Text style={[styles.label, { color: tint }]}>
        {(statusLabels[status] ?? status ?? 'Unknown').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'relative',
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  tintFill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
});
