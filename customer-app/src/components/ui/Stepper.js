import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, CONTINUOUS, radii, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * Stepper
 *
 * Quantity control: two circular glyph buttons flanking a count, all inside one
 * pill. Kept as its own primitive rather than two `IconButton`s so the discs
 * cannot drift apart between the bag and anywhere else quantity is edited.
 *
 * The decrement button is never disabled — at one unit it removes the line,
 * which is the behaviour the bag already implements and is less surprising than
 * a dead control.
 */
export default function Stepper({ value, onIncrement, onDecrement, label, style }) {
  return (
    <View style={[styles.pill, style]}>
      <Pressable
        onPress={onDecrement}
        accessibilityRole="button"
        accessibilityLabel={label ? `Remove one ${label}` : 'Remove one'}
        hitSlop={6}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.glyph}>−</Text>
      </Pressable>

      <Text style={styles.count} accessibilityLabel={`Quantity ${value}`}>
        {value}
      </Text>

      <Pressable
        onPress={onIncrement}
        accessibilityRole="button"
        accessibilityLabel={label ? `Add one ${label}` : 'Add one'}
        hitSlop={6}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.glyph}>+</Text>
      </Pressable>
    </View>
  );
}

const BUTTON = 28;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
    gap: spacing.xxs,
    borderRadius: radii.pill,
    backgroundColor: colors.glassThin,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    ...CONTINUOUS,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: radii.pill,
    backgroundColor: colors.glassThick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  glyph: {
    color: colors.ivory,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '600',
  },
  count: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ivory,
    minWidth: 20,
    textAlign: 'center',
  },
});
