import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, shadows, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * TabDock
 *
 * The floating navigation bar: a dark pill hovering above the home indicator
 * rather than a bar welded to the screen edge. The active item expands into a
 * light pill that carries its label; the rest stay as glyphs.
 *
 * This is a *presentational* dock over the existing native stack, not a tab
 * navigator. The app's two flows are separate stacks chosen by role, and
 * introducing a real tab navigator underneath that would mean a second
 * navigation state to keep in step for what is, here, four `navigate` calls.
 *
 * It renders inside each screen rather than around the navigator, so a screen
 * that should not show it — a product page, checkout — simply leaves it out.
 */
export default function TabDock({ items, value, onChange, style }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }, style]}
      pointerEvents="box-none"
    >
      <View style={styles.dock}>
        {items.map((item) => {
          const active = item.key === value;

          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && !active && styles.pressed,
              ]}
            >
              <Text style={[styles.glyph, active && styles.glyphActive]}>{item.glyph}</Text>

              {/* The label only appears on the active item — that expansion is
                  what signals selection, so no underline or dot is needed. */}
              {active ? <Text style={styles.label}>{item.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    padding: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.glassFillDense,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorderStrong,
    ...shadows.high,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 52,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.light,
    paddingHorizontal: spacing.md - 2,
  },
  pressed: {
    opacity: 0.6,
  },
  glyph: {
    color: colors.ash,
    fontSize: 17,
    lineHeight: 21,
  },
  glyphActive: {
    color: colors.onLight,
  },
  label: {
    ...typography.micro,
    fontSize: 11,
    letterSpacing: 0.4,
    fontWeight: '700',
    color: colors.onLight,
  },
});
