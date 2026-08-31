import { StyleSheet, Text, View } from 'react-native';

import { Surface } from '../ui';
import { colors, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * StatStrip
 *
 * The figures band under the hero: three tiles that answer "is there anything
 * here for me" before a single product has been scrolled to. Each is its own
 * card rather than a divided row, so the strip reads as part of the bento grid
 * rather than a table dropped into it.
 *
 * The tiles carry no light of their own. They are panes of glass over the
 * app's wallpaper, so each one picks up whatever the aurora happens to be doing
 * behind it — which is both livelier than a baked-in bloom and free of the hard
 * circular edge a blob clipped to a small tile leaves behind.
 */
export default function StatStrip({ items, style }) {
  return (
    <View style={[styles.row, style]}>
      {items.map((item) => (
        <Surface
          key={item.label}
          tone="regular"
          radius={radii.lg}
          elevation="low"
          style={styles.tile}
        >
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </Surface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  tile: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    minHeight: 88,
    justifyContent: 'flex-end',
  },
  value: {
    ...typography.numeric,
    fontSize: 24,
    color: colors.ivory,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    color: colors.ash,
    marginTop: 5,
  },
});
