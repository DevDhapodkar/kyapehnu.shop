import { StyleSheet, Text, View } from 'react-native';

import Icon from './Icon';
import { colors, radii, spacing } from '../../theme/colors';
import { type } from '../../theme/tokens';

/**
 * StatTile
 *
 * One number, told properly. The whole point of the tile is the reading order
 * it forces: glyph → value → what the value *is* → why it matters. A vendor
 * glancing at their desk, or a buyer glancing at a delivery, should get the
 * number before they read a single word.
 *
 * The value uses tabular numerals so a row of tiles keeps its columns aligned
 * as the numbers change, and `emphasis` tints only the value — the label stays
 * neutral so a row of tiles does not turn into a row of competing colours.
 */
const EMPHASIS = {
  neutral: colors.ivory,
  gold: colors.gold,
  crimson: colors.crimsonGlow,
  jade: colors.jade,
  muted: colors.ash,
};

export default function StatTile({
  icon,
  value,
  label,
  hint,
  emphasis = 'neutral',
  align = 'left',
  style,
}) {
  const tint = EMPHASIS[emphasis] ?? EMPHASIS.neutral;
  const centred = align === 'center';

  return (
    <View
      style={[styles.tile, centred && styles.tileCentred, style]}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      {icon ? (
        <Icon name={icon} size="sm" color={tint} style={styles.icon} />
      ) : null}

      <Text style={[styles.value, { color: tint }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
      {hint ? (
        <Text style={styles.hint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * A row of tiles separated by hairlines — the "informatics strip" that opens a
 * screen. Dividers are drawn between children rather than on them so the row
 * never ends on a stray rule.
 */
export function StatRow({ children, style }) {
  const tiles = Array.isArray(children) ? children.filter(Boolean) : [children];

  return (
    <View style={[styles.row, style]}>
      {tiles.map((tile, index) => (
        <View key={index} style={styles.rowCell}>
          {index > 0 ? <View style={styles.rowRule} /> : null}
          {tile}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
  },
  tileCentred: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: spacing.xs,
  },
  value: {
    ...type.numeric,
    fontSize: 19,
  },
  label: {
    ...type.caption,
    color: colors.slate,
    fontSize: 9,
    letterSpacing: 1.6,
    marginTop: 3,
  },
  hint: {
    ...type.caption,
    color: colors.ash,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radii.md,
  },
  rowCell: {
    flex: 1,
    flexDirection: 'row',
  },
  rowRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.glassBorder,
    marginRight: spacing.sm,
  },
});
