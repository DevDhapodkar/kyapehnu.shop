import { StyleSheet, Text, View } from 'react-native';

import { Glow, Surface } from '../ui';
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
 * The first tile carries an aurora bloom behind it — one lit tile per band is
 * enough to keep the page from going flat, and any more turns the accent into
 * wallpaper.
 */
export default function StatStrip({ items, style }) {
  return (
    <View style={[styles.row, style]}>
      {items.map((item, index) => (
        <Surface
          key={item.label}
          tone="surface"
          radius={radii.lg}
          elevation="low"
          style={styles.tile}
        >
          {index === 0 ? (
            <Glow color={colors.iris} size={210} intensity={0.5} style={styles.glow} />
          ) : null}

          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label} numberOfLines={2}>
            {item.label.toUpperCase()}
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
  glow: {
    position: 'absolute',
    top: -110,
    left: -60,
  },
  value: {
    ...typography.numeric,
    fontSize: 24,
    color: colors.ivory,
  },
  label: {
    ...typography.micro,
    fontSize: 8,
    letterSpacing: 1.4,
    color: colors.ash,
    marginTop: 5,
  },
});
