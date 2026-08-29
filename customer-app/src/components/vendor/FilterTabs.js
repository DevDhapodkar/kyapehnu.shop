import { ScrollView, StyleSheet } from 'react-native';

import Chip from '../ui/Chip';
import { spacing } from '../../theme/colors';

/**
 * FilterTabs
 *
 * The order queue's status filter. Each tab is a Chip, so selection is
 * signalled the same way it is everywhere else in the app — a brighter fill and
 * ivory type, never an accent colour, because crimson is reserved for actions
 * and must not double as a state.
 *
 * The count rides inside the chip rather than beside it: a shopkeeper wants
 * "New (3)" as one object to tap, not a label and a number to reconcile.
 */
export default function FilterTabs({ options, value, onChange, counts = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Without `flexGrow: 0` the ScrollView takes the column's leftover space
      // and stretches every tab to that full height.
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => (
        <Chip
          key={option.key}
          label={option.label}
          count={counts[option.key]}
          selected={option.key === value}
          onPress={() => onChange(option.key)}
          accessibilityLabel={`${option.label} orders`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
  },
});
