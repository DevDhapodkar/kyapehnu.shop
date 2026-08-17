import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../theme/colors';

/**
 * Horizontal status filter for the order queue.
 *
 * Selection is signalled by a brighter frosted fill and ivory type rather than
 * an accent colour — crimson stays reserved for actions, never for state.
 * Scrollable so the tab strip survives narrow phones and longer labels.
 */
export default function FilterTabs({ options, value, onChange, counts = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Without `flexGrow: 0` the ScrollView takes the column's leftover space
      // and `alignItems` stretches every tab to that full height.
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const active = option.key === value;
        const count = counts[option.key];

        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.tab,
              active && styles.tabActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label.toUpperCase()}
            </Text>
            {count ? (
              <View style={[styles.badge, active && styles.badgeActive]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
  },
  tabActive: {
    backgroundColor: colors.charcoalLight,
    borderColor: colors.graphite,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.ash,
  },
  labelActive: {
    color: colors.ivory,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: colors.graphite,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: colors.crimson,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.platinum,
  },
  badgeTextActive: {
    color: colors.ivory,
  },
});
