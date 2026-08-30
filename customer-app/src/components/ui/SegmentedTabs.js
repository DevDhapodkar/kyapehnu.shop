import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, CONTINUOUS, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * SegmentedTabs
 *
 * The pill switcher: a dark rounded trough holding one lit pill that travels
 * between the options. Used for storefront categories and the vendor's order
 * filters, so both flows read as the same control.
 *
 * Selection is signalled by a *near-white* pill with ink type rather than a
 * tint — the same inversion the primary button uses, which keeps state and
 * action speaking one visual language and leaves colour free to mean status.
 *
 * `scrollable` keeps the trough one row on narrow phones instead of wrapping;
 * without it the options share the width evenly, which is what a 2–4 option
 * switcher wants.
 */
export default function SegmentedTabs({
  options,
  value,
  onChange,
  counts = {},
  scrollable = false,
  style,
}) {
  const tabs = options.map((option) => {
    const active = option.key === value;
    const count = counts[option.key];

    return (
      <Pressable
        key={option.key}
        onPress={() => onChange(option.key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={option.label}
        style={({ pressed }) => [
          styles.tab,
          !scrollable && styles.tabFlex,
          active && styles.tabActive,
          pressed && !active && styles.pressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
          {option.label}
        </Text>

        {count ? (
          <View style={[styles.count, active && styles.countActive]}>
            <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  });

  if (!scrollable) {
    return <View style={[styles.trough, style]}>{tabs}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Without `flexGrow: 0` the ScrollView claims the column's leftover space
      // and stretches every pill to that height.
      style={[styles.scroll, style]}
      contentContainerStyle={styles.trough}
    >
      {tabs}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  trough: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    padding: 5,
    borderRadius: radii.pill,
    // A veil, not a blur: the switcher rides on a pane that is already frosted.
    backgroundColor: colors.glassThin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...CONTINUOUS,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  tabFlex: {
    flex: 1,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.light,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    ...typography.micro,
    letterSpacing: 0.9,
    fontSize: 11,
    color: colors.ash,
  },
  labelActive: {
    color: colors.onLight,
    fontWeight: '700',
  },
  count: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.glassRegular,
    alignItems: 'center',
  },
  countActive: {
    backgroundColor: colors.onLight,
  },
  countText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: colors.platinum,
  },
  countTextActive: {
    color: colors.light,
  },
});
