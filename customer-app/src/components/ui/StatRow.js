import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * StatRow
 *
 * The three-up figure strip: a big number over a small uppercase caption,
 * repeated across the row. Used on the profile header and the vendor desk,
 * where the first thing wanted is a count, not a sentence.
 *
 * Items get equal width rather than hugging their content, so the numbers line
 * up on a column grid even when one of them is four digits and the others are
 * one.
 */
export default function StatRow({ items, divided = false, style }) {
  return (
    <View style={[styles.row, style]}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[styles.cell, divided && index > 0 && styles.cellDivided]}
        >
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cell: {
    flex: 1,
  },
  cellDivided: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.glassBorder,
    paddingLeft: spacing.sm,
  },
  value: {
    ...typography.h2,
    color: colors.ivory,
  },
  label: {
    ...typography.caption,
    fontSize: 12,
    color: colors.ash,
    marginTop: 4,
  },
});
